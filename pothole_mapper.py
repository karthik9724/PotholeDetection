#!/usr/bin/env python3

import csv
import sys

reader = csv.DictReader(sys.stdin)

if reader.fieldnames:
    reader.fieldnames = [
        name.strip().lower() if name else name
        for name in reader.fieldnames
    ]

    for row in reader:
        address = (row.get("address") or "").strip()

        if address:
            print(f"{address}\t1")
