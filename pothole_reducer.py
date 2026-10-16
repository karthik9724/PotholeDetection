#!/usr/bin/env python3

import sys

current_address = None
total = 0

for line in sys.stdin:
    line = line.rstrip("\n")

    try:
        address, count = line.rsplit("\t", 1)
        count = int(count)
    except ValueError:
        continue

    if address == current_address:
        total += count
    else:
        if current_address is not None:
            print(f"{current_address}\t{total}")

        current_address = address
        total = count

if current_address is not None:
    print(f"{current_address}\t{total}")
