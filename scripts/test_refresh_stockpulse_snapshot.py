#!/usr/bin/env python3
from refresh_stockpulse_snapshot import unexpected_status_lines

SNAPSHOT = 'src/data/stockpulse-snapshot.json'

assert unexpected_status_lines(f' M {SNAPSHOT}\n', SNAPSHOT) == []
assert unexpected_status_lines(f'?? {SNAPSHOT}\n', SNAPSHOT) == []
assert unexpected_status_lines(f' M {SNAPSHOT}\n M scripts/other.py\n', SNAPSHOT) == [' M scripts/other.py']
assert unexpected_status_lines(f' M {SNAPSHOT}\n?? scripts/other.py\n', SNAPSHOT) == ['?? scripts/other.py']

print('StockPulse snapshot status parsing tests passed')
