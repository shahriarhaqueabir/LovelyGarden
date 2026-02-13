import sqlite3
import json
import os

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(SCRIPT_DIR, "plants.db")
KB_JSON = os.path.join(SCRIPT_DIR, "plants-kb.json")
CATALOG_JSON = os.path.join(SCRIPT_DIR, "plants-catalog.json")

# Mapping for month conversion to integers
MONTHS = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
}


def setup_database(cursor):
    """Initializes the comprehensive normalized schema."""
    cursor.executescript("""
        -- Core plant information
        CREATE TABLE IF NOT EXISTS plants (
            plant_id TEXT PRIMARY KEY,
            common_name TEXT NOT NULL,
            scientific_name TEXT,
            family TEXT,
            plant_type TEXT,
            life_cycle TEXT,
            notes TEXT
        );

        -- Plant requirements
        CREATE TABLE IF NOT EXISTS plant_requirements (
            plant_id TEXT PRIMARY KEY,
            sunlight TEXT,
            water_requirements TEXT,
            soil_ph TEXT,
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        -- Soil types (many-to-many)
        CREATE TABLE IF NOT EXISTS plant_soil_types (
            plant_id TEXT,
            soil_type TEXT,
            PRIMARY KEY (plant_id, soil_type),
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        -- Growth stages (ordered list with metadata)
        CREATE TABLE IF NOT EXISTS plant_growth_stages (
            plant_id TEXT,
            stage_order INTEGER,
            stage_name TEXT,
            duration_days INTEGER,
            water_interval_days INTEGER,
            PRIMARY KEY (plant_id, stage_order),
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        -- Plant interactions (companions and incompatibles)
        CREATE TABLE IF NOT EXISTS plant_interactions (
            plant_a TEXT,
            plant_b TEXT,
            type TEXT CHECK(type IN ('companion', 'incompatible')),
            PRIMARY KEY (plant_a, plant_b, type),
            FOREIGN KEY (plant_a) REFERENCES plants(plant_id),
            FOREIGN KEY (plant_b) REFERENCES plants(plant_id)
        );

        -- Seasonality windows
        CREATE TABLE IF NOT EXISTS plant_seasonality (
            plant_id TEXT,
            activity TEXT CHECK(activity IN ('sowing', 'harvest')),
            start_month INTEGER,
            end_month INTEGER,
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        -- Common pests
        CREATE TABLE IF NOT EXISTS plant_pests (
            plant_id TEXT,
            pest_id TEXT,
            PRIMARY KEY (plant_id, pest_id),
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        -- Common diseases
        CREATE TABLE IF NOT EXISTS plant_diseases (
            plant_id TEXT,
            disease_id TEXT,
            PRIMARY KEY (plant_id, disease_id),
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        -- Nutrient preferences
        CREATE TABLE IF NOT EXISTS plant_nutrients (
            plant_id TEXT,
            nutrient_preference TEXT,
            PRIMARY KEY (plant_id, nutrient_preference),
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_plant_type ON plants(plant_type);
        CREATE INDEX IF NOT EXISTS idx_plant_family ON plants(family);
        CREATE INDEX IF NOT EXISTS idx_seasonality_activity ON plant_seasonality(activity);
        CREATE INDEX IF NOT EXISTS idx_interactions_type ON plant_interactions(type);
    """)


def parse_month(m):
    if isinstance(m, int):
        return m
    if isinstance(m, str):
        if m.isdigit():
            return int(m)
        return MONTHS.get(m)
    return None


def merge_data(catalog_data, kb_data):
    """Merges plants from both data sources into a single dictionary."""
    plants_dict = {}

    # Process Catalog Data First
    for entry in catalog_data:
        p_id = entry.get("id")
        if not p_id:
            continue

        reqs = entry.get("requirements", {})
        seasonality = entry.get("seasonality", {})

        plants_dict[p_id] = {
            "plant_id": p_id,
            "common_name": entry.get("name"),
            "scientific_name": entry.get("scientific_name"),
            "family": entry.get("family"),
            "plant_type": entry.get("plant_type"),
            "life_cycle": entry.get("life_cycle"),
            "notes": entry.get("notes", ""),
            "sunlight": reqs.get("sunlight", entry.get("sunlight")),
            "water_requirements": reqs.get(
                "water_requirements", entry.get("water_requirements")
            ),
            "soil_ph": reqs.get("soil_ph", ""),
            "soil_types": [],  # Will fill from reqs and kb
            "growth_stages": [],  # Will fill from stages or kb
            "companion_plants": set(entry.get("companions", [])),
            "incompatible_plants": set(entry.get("antagonists", [])),
            "seasonality": seasonality,
            "common_pests": set(),
            "common_diseases": set(),
            "nutrient_preferences": set(),
        }

        # Handle soil_type from catalog reqs
        st = reqs.get("soil_type")
        if st:
            # Handle if it's a string or list
            if isinstance(st, str):
                plants_dict[p_id]["soil_types"].append(st)
            elif isinstance(st, list):
                plants_dict[p_id]["soil_types"].extend(st)

        # Handle stages from catalog
        for stage in entry.get("stages", []):
            plants_dict[p_id]["growth_stages"].append(
                {
                    "name": stage.get("name") or stage.get("id"),
                    "duration": stage.get("durationDays"),
                    "water_interval": stage.get("waterFrequencyDays"),
                }
            )

    # Process KB Data and Merge
    for entry in kb_data:
        p_id = entry.get("plant_id")
        if not p_id:
            continue

        if p_id not in plants_dict:
            plants_dict[p_id] = {
                "plant_id": p_id,
                "common_name": entry.get("common_name"),
                "scientific_name": entry.get("scientific_name"),
                "family": entry.get("family"),
                "plant_type": entry.get("type"),
                "life_cycle": entry.get("life_cycle"),
                "notes": entry.get("notes", ""),
                "sunlight": entry.get("sunlight"),
                "water_requirements": entry.get("water_requirements"),
                "soil_ph": entry.get("soil_ph", ""),
                "soil_types": [],
                "growth_stages": [],
                "companion_plants": set(entry.get("companion_plants", [])),
                "incompatible_plants": set(entry.get("incompatible_plants", [])),
                "seasonality": entry.get("seasonality", {}),
                "common_pests": set(entry.get("common_pests", [])),
                "common_diseases": set(entry.get("common_diseases", [])),
                "nutrient_preferences": set(entry.get("nutrient_preferences", [])),
            }
        else:
            # Update existing with KB info if missing
            p = plants_dict[p_id]
            if not p["scientific_name"]:
                p["scientific_name"] = entry.get("scientific_name")
            if not p["family"]:
                p["family"] = entry.get("family")
            if not p["plant_type"]:
                p["plant_type"] = entry.get("type")
            if not p["life_cycle"]:
                p["life_cycle"] = entry.get("life_cycle")
            if entry.get("notes") and len(entry["notes"]) > len(p["notes"]):
                p["notes"] = entry["notes"]

            p["companion_plants"].update(entry.get("companion_plants", []))
            p["incompatible_plants"].update(entry.get("incompatible_plants", []))
            p["common_pests"].update(entry.get("common_pests", []))
            p["common_diseases"].update(entry.get("common_diseases", []))
            p["nutrient_preferences"].update(entry.get("nutrient_preferences", []))

            # Seasonality merge (if KB has more activities)
            kb_season = entry.get("seasonality", {})
            if kb_season:
                for act in ["sowing", "harvest"]:
                    if act in kb_season and act not in p["seasonality"]:
                        p["seasonality"][act] = kb_season[act]

        # Merge soil types from KB
        plants_dict[p_id]["soil_types"].extend(entry.get("soil_type", []))

        # Merge growth stages from KB if catalog didn't have detailed ones
        if not plants_dict[p_id]["growth_stages"]:
            for stage in entry.get("growth_stage", []):
                plants_dict[p_id]["growth_stages"].append(
                    {"name": stage, "duration": None, "water_interval": None}
                )

    return plants_dict


def ingest_data(db_path, plants):
    """Ingests merged plant data into SQLite database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop existing tables to ensure schema updates are applied
    tables = [
        "plant_nutrients",
        "plant_diseases",
        "plant_pests",
        "plant_seasonality",
        "plant_interactions",
        "plant_growth_stages",
        "plant_soil_types",
        "plant_requirements",
        "plants",
    ]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")

    setup_database(cursor)

    print(f"Ingesting {len(plants)} merged plant entries...")

    for p_id, entry in plants.items():
        # 1. Plants
        cursor.execute(
            "INSERT INTO plants (plant_id, common_name, scientific_name, family, plant_type, life_cycle, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                p_id,
                entry["common_name"],
                entry["scientific_name"],
                entry["family"],
                entry["plant_type"],
                entry["life_cycle"],
                entry["notes"],
            ),
        )

        # 2. Requirements
        cursor.execute(
            "INSERT INTO plant_requirements (plant_id, sunlight, water_requirements, soil_ph) VALUES (?, ?, ?, ?)",
            (p_id, entry["sunlight"], entry["water_requirements"], entry["soil_ph"]),
        )

        # 3. Soil Types
        for st in set(entry["soil_types"]):
            cursor.execute(
                "INSERT OR IGNORE INTO plant_soil_types (plant_id, soil_type) VALUES (?, ?)",
                (p_id, st),
            )

        # 4. Growth Stages
        for idx, stage in enumerate(entry["growth_stages"]):
            cursor.execute(
                "INSERT INTO plant_growth_stages (plant_id, stage_order, stage_name, duration_days, water_interval_days) VALUES (?, ?, ?, ?, ?)",
                (p_id, idx, stage["name"], stage["duration"], stage["water_interval"]),
            )

        # 5. Seasonality
        seasonality = entry["seasonality"]
        for activity in ["sowing", "harvest"]:
            if activity in seasonality:
                windows = seasonality[activity]
                if isinstance(windows, dict):
                    windows = [windows]
                for window in windows:
                    start = parse_month(window.get("start_month"))
                    end = parse_month(window.get("end_month"))
                    if start and end:
                        cursor.execute(
                            "INSERT INTO plant_seasonality (plant_id, activity, start_month, end_month) VALUES (?, ?, ?, ?)",
                            (p_id, activity, start, end),
                        )

        # 6. Interactions
        for companion in entry["companion_plants"]:
            pair = sorted([p_id, companion])
            cursor.execute(
                "INSERT OR IGNORE INTO plant_interactions (plant_a, plant_b, type) VALUES (?, ?, ?)",
                (pair[0], pair[1], "companion"),
            )
        for antagonist in entry["incompatible_plants"]:
            pair = sorted([p_id, antagonist])
            cursor.execute(
                "INSERT OR IGNORE INTO plant_interactions (plant_a, plant_b, type) VALUES (?, ?, ?)",
                (pair[0], pair[1], "incompatible"),
            )

        # 7. Pests, Diseases, Nutrients
        for pest in entry["common_pests"]:
            cursor.execute(
                "INSERT OR IGNORE INTO plant_pests (plant_id, pest_id) VALUES (?, ?)",
                (p_id, pest),
            )
        for disease in entry["common_diseases"]:
            cursor.execute(
                "INSERT OR IGNORE INTO plant_diseases (plant_id, disease_id) VALUES (?, ?)",
                (p_id, disease),
            )
        for nutrient in entry["nutrient_preferences"]:
            cursor.execute(
                "INSERT OR IGNORE INTO plant_nutrients (plant_id, nutrient_preference) VALUES (?, ?)",
                (p_id, nutrient),
            )

    conn.commit()
    conn.close()
    print(f"Successfully migrated data to {db_path}")


def export_data(db_path):
    """Exports data from SQLite back to JSON files."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Fetch all plants
    cursor.execute("SELECT * FROM plants")
    plant_rows = cursor.fetchall()

    catalog_output = []
    kb_output = []

    for p_row in plant_rows:
        p_id = p_row["plant_id"]

        # Requirements
        cursor.execute("SELECT * FROM plant_requirements WHERE plant_id = ?", (p_id,))
        req_row = cursor.fetchone()

        # Soil Types
        cursor.execute(
            "SELECT soil_type FROM plant_soil_types WHERE plant_id = ?", (p_id,)
        )
        soil_types = [r["soil_type"] for r in cursor.fetchall()]

        # Growth Stages
        cursor.execute(
            "SELECT * FROM plant_growth_stages WHERE plant_id = ? ORDER BY stage_order",
            (p_id,),
        )
        stages = cursor.fetchall()

        # Interactions
        cursor.execute(
            "SELECT plant_b, type FROM plant_interactions WHERE plant_a = ?", (p_id,)
        )
        interactions = cursor.fetchall()
        cursor.execute(
            "SELECT plant_a, type FROM plant_interactions WHERE plant_b = ?", (p_id,)
        )
        interactions += cursor.fetchall()

        companions = [r[0] for r in interactions if r[1] == "companion"]
        antagonists = [r[0] for r in interactions if r[1] == "incompatible"]

        # Seasonality
        cursor.execute("SELECT * FROM plant_seasonality WHERE plant_id = ?", (p_id,))
        seas_rows = cursor.fetchall()
        seasonality = {"sowing": [], "harvest": []}
        for s in seas_rows:
            seasonality[s["activity"]].append(
                {"start_month": s["start_month"], "end_month": s["end_month"]}
            )

        # Pests, Diseases, Nutrients
        cursor.execute("SELECT pest_id FROM plant_pests WHERE plant_id = ?", (p_id,))
        pests = [r["pest_id"] for r in cursor.fetchall()]
        cursor.execute(
            "SELECT disease_id FROM plant_diseases WHERE plant_id = ?", (p_id,)
        )
        diseases = [r["disease_id"] for r in cursor.fetchall()]
        cursor.execute(
            "SELECT nutrient_preference FROM plant_nutrients WHERE plant_id = ?",
            (p_id,),
        )
        nutrients = [r["nutrient_preference"] for r in cursor.fetchall()]

        # Build Catalog Entry
        catalog_output.append(
            {
                "id": p_id,
                "name": p_row["common_name"],
                "scientific_name": p_row["scientific_name"],
                "family": p_row["family"],
                "plant_type": p_row["plant_type"],
                "life_cycle": p_row["life_cycle"],
                "notes": p_row["notes"],
                "companions": companions,
                "antagonists": antagonists,
                "seasonality": seasonality,
                "requirements": {
                    "plant_id": p_id,
                    "sunlight": req_row["sunlight"] if req_row else "",
                    "water_requirements": req_row["water_requirements"]
                    if req_row
                    else "",
                    "soil_ph": req_row["soil_ph"] if req_row else "",
                    "soil_type": soil_types[0] if soil_types else "",
                },
                "stages": [
                    {
                        "id": s["stage_name"].lower().replace(" ", "_"),
                        "name": s["stage_name"],
                        "durationDays": s["duration_days"],
                        "waterFrequencyDays": s["water_interval_days"],
                    }
                    for s in stages
                ],
            }
        )

        # Build KB Entry
        kb_output.append(
            {
                "plant_id": p_id,
                "common_name": p_row["common_name"],
                "scientific_name": p_row["scientific_name"],
                "family": p_row["family"],
                "type": p_row["plant_type"],
                "soil_type": soil_types,
                "sunlight": req_row["sunlight"] if req_row else "",
                "water_requirements": req_row["water_requirements"] if req_row else "",
                "nutrient_preferences": nutrients,
                "growth_stage": [s["stage_name"] for s in stages],
                "seasonality": {
                    act: {
                        "start_month": list(MONTHS.keys())[
                            list(MONTHS.values()).index(win[0]["start_month"])
                        ]
                        if win
                        else "",
                        "end_month": list(MONTHS.keys())[
                            list(MONTHS.values()).index(win[0]["end_month"])
                        ]
                        if win
                        else "",
                    }
                    for act, win in seasonality.items()
                    if win
                },
                "companion_plants": companions,
                "incompatible_plants": antagonists,
                "common_pests": pests,
                "common_diseases": diseases,
                "notes": p_row["notes"],
            }
        )

    with open(CATALOG_JSON, "w", encoding="utf-8") as f:
        json.dump(catalog_output, f, indent=2)
    with open(KB_JSON, "w", encoding="utf-8") as f:
        json.dump(kb_output, f, indent=2)

    conn.close()
    print(f"Successfully exported data to JSON files from {db_path}")


if __name__ == "__main__":
    import sys

    try:
        if len(sys.argv) > 1 and sys.argv[1] == "export":
            if os.path.exists(DB_NAME):
                export_data(DB_NAME)
            else:
                print(f"Error: {DB_NAME} not found. Run migration first.")
        else:
            catalog_data = []
            if os.path.exists(CATALOG_JSON):
                with open(CATALOG_JSON, "r", encoding="utf-8-sig") as f:
                    catalog_data = json.load(f)

            kb_data = []
            if os.path.exists(KB_JSON):
                with open(KB_JSON, "r", encoding="utf-8-sig") as f:
                    kb_data = json.load(f)

            if not catalog_data and not kb_data:
                print("No data found to ingest.")
                if os.path.exists(DB_NAME):
                    print(
                        "Hint: Use 'python ingest.py export' to generate JSONs from the DB."
                    )
            else:
                print("Starting migration from JSON to SQLite...")
                merged = merge_data(catalog_data, kb_data)
                ingest_data(DB_NAME, merged)
                print("\nMigration complete. SQLite DB is now the main source.")
                print(
                    "You can edit the DB directly and run 'python ingest.py export' to update JSONs."
                )

    except Exception as e:
        print(f"Error: {e}")
        raise
