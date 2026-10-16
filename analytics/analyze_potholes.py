
import csv
import json
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = BASE_DIR / "sample-data" / "pothole_reports.csv"
OUTPUT_FILE = BASE_DIR / "analytics" / "summary.json"


def analyze_potholes():
    with open(INPUT_FILE, "r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        # Clean column names to avoid hidden spaces or characters.
        reader.fieldnames = [
            name.strip().lower() if name else name
            for name in reader.fieldnames
        ]

        print("Detected CSV columns:", reader.fieldnames)

        required_columns = {"severity", "status", "address"}
        missing = required_columns - set(reader.fieldnames)

        if missing:
            raise ValueError(
                f"Missing columns: {missing}. "
                f"Detected columns: {reader.fieldnames}"
            )

        reports = list(reader)

    severity_counts = Counter()
    status_counts = Counter()
    location_counts = Counter()

    for report in reports:
        severity = (report.get("severity") or "").strip().title()
        status = (report.get("status") or "").strip().title()
        address = (report.get("address") or "").strip()

        if severity:
            severity_counts[severity] += 1

        if status:
            status_counts[status] += 1

        if address:
            location_counts[address] += 1

    repeated_locations = [
        {"address": address, "reportCount": count}
        for address, count in location_counts.most_common()
        if count > 1
    ]

    summary = {
        "totalReports": len(reports),
        "severityCounts": dict(severity_counts),
        "statusCounts": dict(status_counts),
        "repeatedLocations": repeated_locations
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=4)

    print("\n===== ROADCARE ANALYTICS =====")
    print("Total reports:", len(reports))

    print("\nReports by severity:")
    for severity, count in severity_counts.items():
        print(f"{severity}: {count}")

    print("\nReports by status:")
    for status, count in status_counts.items():
        print(f"{status}: {count}")

    print("\nRepeated locations:")
    if repeated_locations:
        for item in repeated_locations:
            print(f'{item["address"]}: {item["reportCount"]} reports')
    else:
        print("No repeated locations found.")

    print("\nAnalytics saved to:", OUTPUT_FILE)


if __name__ == "__main__":
    analyze_potholes()
