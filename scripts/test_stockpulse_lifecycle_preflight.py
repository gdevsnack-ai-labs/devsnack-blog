#!/usr/bin/env python3
from stockpulse_weekly_pipeline import lifecycle_preflight, PipelineError

LIVE = [{'status': 'live', 'lifecycle_status': 'live'}] * 2
CONSOLIDATED = [{'status': 'live', 'lifecycle_status': 'consolidated'}] * 2
MIXED = [{'status': 'live', 'lifecycle_status': 'live'}, {'status': 'live', 'lifecycle_status': 'consolidated'}]

assert lifecycle_preflight(LIVE) == 'ready'
assert lifecycle_preflight(CONSOLIDATED) == 'already_consolidated'
try:
    lifecycle_preflight(MIXED)
except PipelineError:
    pass
else:
    raise AssertionError('mixed lifecycle selection must fail closed')

print('StockPulse lifecycle preflight tests passed')
