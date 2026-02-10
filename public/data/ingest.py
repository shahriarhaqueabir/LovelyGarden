import sqlite3
import json

# Configuration
DB_NAME = "plants.db"
# Mapping for month conversion to integers
MONTHS = {
    "January": 1, "February": 2, "March": 3, "April": 4, 
    "May": 5, "June": 6, "July": 7, "August": 8, 
    "September": 9, "October": 10, "November": 11, "December": 12
}

def setup_database(cursor):
    """Initializes the normalized schema."""
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS plants (
            plant_id TEXT PRIMARY KEY,
            common_name TEXT NOT NULL,
            scientific_name TEXT,
            family TEXT,
            plant_type TEXT,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS plant_requirements (
            plant_id TEXT PRIMARY KEY,
            sunlight TEXT,
            water_requirements TEXT,
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );

        CREATE TABLE IF NOT EXISTS plant_interactions (
            plant_a TEXT,
            plant_b TEXT,
            type TEXT CHECK(type IN ('companion', 'incompatible')),
            PRIMARY KEY (plant_a, plant_b, type),
            FOREIGN KEY (plant_a) REFERENCES plants(plant_id),
            FOREIGN KEY (plant_b) REFERENCES plants(plant_id)
        );

        CREATE TABLE IF NOT EXISTS plant_seasonality (
            plant_id TEXT,
            activity TEXT CHECK(activity IN ('sowing', 'harvest')),
            start_month INTEGER,
            end_month INTEGER,
            FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
        );
    ''')

def ingest_data(db_path, json_data):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    setup_database(cursor)

    for entry in json_data:
        p_id = entry['plant_id']
        
        # 1. Insert Core Plant Data
        cursor.execute('''
            INSERT OR REPLACE INTO plants (plant_id, common_name, scientific_name, family, plant_type, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (p_id, entry['common_name'], entry['scientific_name'], entry['family'], entry['type'], entry.get('notes', '')))

        # 2. Insert Requirements
        cursor.execute('''
            INSERT OR REPLACE INTO plant_requirements (plant_id, sunlight, water_requirements)
            VALUES (?, ?, ?)
        ''', (p_id, entry['sunlight'], entry['water_requirements']))

        # 3. Insert Seasonality
        for activity, window in entry.get('seasonality', {}).items():
            cursor.execute('''
                INSERT INTO plant_seasonality (plant_id, activity, start_month, end_month)
                VALUES (?, ?, ?, ?)
            ''', (p_id, activity, MONTHS.get(window['start_month']), MONTHS.get(window['end_month'])))

        # 4. Insert Interactions (with Reciprocity)
        # Process companions
        for companion in entry.get('companion_plants', []):
            # Sort IDs alphabetically to ensure (A, B) is same as (B, A) in PK
            pair = sorted([p_id, companion])
            cursor.execute('INSERT OR IGNORE INTO plant_interactions VALUES (?, ?, ?)', (pair[0], pair[1], 'companion'))
        
        # Process incompatibles
        for incompatible in entry.get('incompatible_plants', []):
            pair = sorted([p_id, incompatible])
            cursor.execute('INSERT OR IGNORE INTO plant_interactions VALUES (?, ?, ?)', (pair[0], pair[1], 'incompatible'))

    conn.commit()
    conn.close()
    print(f"Successfully created {db_path} with normalized data.")

if __name__ == "__main__":
    # 1. Load your consolidated JSON file
    try:
        with open('data.json', 'r') as f:
            plant_data = json.load(f)
        
        # 2. Run the ingestion process
        ingest_data(DB_NAME, plant_data)
        
    except FileNotFoundError:
        print("Error: 'data.json' not found. Ensure the file is in the same folder as this script.")
    except json.JSONDecodeError:
        print("Error: 'data.json' contains invalid JSON. Check your brackets and commas.")