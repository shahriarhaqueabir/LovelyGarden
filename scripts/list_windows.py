import sqlite3
import json

DB_PATH = "public/data/plants.db"
MONTHS = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


def get_full_catalog():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.common_name, s.activity, s.start_month, s.end_month 
        FROM plants p 
        JOIN plant_seasonality s ON p.plant_id = s.plant_id 
        ORDER BY p.common_name, s.activity
    """)
    rows = cursor.fetchall()

    catalog = {}
    for r in rows:
        name = r["common_name"]
        if name not in catalog:
            catalog[name] = {}

        start = MONTHS[r["start_month"]]
        end = MONTHS[r["end_month"]]
        catalog[name][r["activity"]] = f"{start} to {end}"

    conn.close()
    return catalog


if __name__ == "__main__":
    catalog = get_full_catalog()
    for plant, data in catalog.items():
        print(f"\n{plant}:")
        if "sowing" in data:
            print(f"  🌱 Sowing:  {data['sowing']}")
        if "harvest" in data:
            print(f"  🧺 Harvest: {data['harvest']}")
