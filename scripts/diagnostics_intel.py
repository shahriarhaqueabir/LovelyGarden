import sqlite3
import json
from datetime import datetime

DB_PATH = "public/data/plants.db"


def analyze_diagnostics():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    current_month = datetime.now().month  # February (2)
    next_month = (current_month % 12) + 1

    # 1. Fetch Sowing Intel
    cursor.execute(
        """
        SELECT p.common_name, s.start_month, s.end_month, p.notes
        FROM plants p 
        JOIN plant_seasonality s ON p.plant_id = s.plant_id 
        WHERE s.activity = 'sowing' 
        AND (
            (s.start_month <= s.end_month AND ? BETWEEN s.start_month AND s.end_month) OR
            (s.start_month > s.end_month AND (? >= s.start_month OR ? <= s.end_month))
        )
    """,
        (current_month, current_month, current_month),
    )
    sowing_now_rows = cursor.fetchall()
    sowing_now = [dict(row) for row in sowing_now_rows]

    # 2. Fetch Harvest Intel
    cursor.execute(
        """
        SELECT p.common_name, s.start_month, s.end_month, p.notes
        FROM plants p 
        JOIN plant_seasonality s ON p.plant_id = s.plant_id 
        WHERE s.activity = 'harvest' 
        AND (
            (s.start_month <= s.end_month AND ? BETWEEN s.start_month AND s.end_month) OR
            (s.start_month > s.end_month AND (? >= s.start_month OR ? <= s.end_month))
        )
    """,
        (current_month, current_month, current_month),
    )
    harvest_now_rows = cursor.fetchall()
    harvest_now = [dict(row) for row in harvest_now_rows]

    # 3. Fetch Gaps
    cursor.execute(
        "SELECT common_name FROM plants WHERE plant_id NOT IN (SELECT plant_id FROM plant_seasonality)"
    )
    missing_seasonality = [row[0] for row in cursor.fetchall()]

    # 4. Intel: Expiring Sowing Windows
    expiring_sowing = []
    for p in sowing_now:
        if p["end_month"] == current_month:
            expiring_sowing.append(p["common_name"])

    # 5. Intel: Peak Harvest
    peak_harvest = []
    for p in harvest_now:
        if p["start_month"] != p["end_month"]:
            peak_harvest.append(p["common_name"])

    total_count = cursor.execute("SELECT COUNT(*) FROM plants").fetchone()[0]

    analysis = {
        "timestamp": datetime.now().isoformat(),
        "current_month": current_month,
        "diagnostics": {
            "sowing_intel": {
                "active_now": [p["common_name"] for p in sowing_now],
                "expiring_soon": expiring_sowing,
                "count": len(sowing_now),
            },
            "harvest_intel": {
                "active_now": [p["common_name"] for p in harvest_now],
                "peak_harvest": peak_harvest,
                "count": len(harvest_now),
            },
            "data_health": {
                "coverage_pct": f"{(1 - len(missing_seasonality) / total_count) * 100:.1f}%",
                "missing_plants": missing_seasonality,
            },
        },
    }

    conn.close()
    return analysis


if __name__ == "__main__":
    report = analyze_diagnostics()
    print(json.dumps(report, indent=2))
