#!/usr/bin/env python3
import stockpulse_weekly_pipeline as pipeline

rows = [
    {'id': 101, 'slug': 'fixture-one', 'title': 'fixture one', 'status': 'live', 'lifecycle_status': 'live'},
    {'id': 102, 'slug': 'fixture-two', 'title': 'fixture two', 'status': 'live', 'lifecycle_status': 'live'},
]
events = []
originals = {
    name: getattr(pipeline, name)
    for name in ['patch_lifecycle', 'verify_lifecycle', 'run_snapshot_refresh', 'wait_for_snapshot', 'verify_public_projections', 'verify_detail_routes']
}
refresh_calls = 0

def fake_patch(ids, status):
    events.append(('patch', status, tuple(ids)))
    return rows

def fake_verify(ids, status):
    events.append(('verify', status, tuple(ids)))

def fake_refresh():
    global refresh_calls
    refresh_calls += 1
    events.append(('refresh', refresh_calls))
    if refresh_calls == 1:
        raise pipeline.PipelineError('injected snapshot failure')

def fake_wait(slugs, should_contain):
    events.append(('wait', should_contain, tuple(sorted(slugs))))

def fake_public(slugs, should_contain):
    events.append(('public', should_contain, tuple(sorted(slugs))))

def fake_detail(input_rows):
    events.append(('detail', tuple(row['id'] for row in input_rows)))

pipeline.patch_lifecycle = fake_patch
pipeline.verify_lifecycle = fake_verify
pipeline.run_snapshot_refresh = fake_refresh
pipeline.wait_for_snapshot = fake_wait
pipeline.verify_public_projections = fake_public
pipeline.verify_detail_routes = fake_detail
try:
    pipeline.transition_with_reconciliation(rows)
except pipeline.PipelineError as exc:
    assert 'reconciled back to live' in str(exc)
else:
    raise AssertionError('injected failure must surface after successful reconciliation')
finally:
    for name, value in originals.items():
        setattr(pipeline, name, value)

assert events == [
    ('patch', 'consolidated', (101, 102)),
    ('verify', 'consolidated', (101, 102)),
    ('refresh', 1),
    ('patch', 'live', (101, 102)),
    ('verify', 'live', (101, 102)),
    ('refresh', 2),
    ('wait', True, ('fixture-one', 'fixture-two')),
    ('public', True, ('fixture-one', 'fixture-two')),
    ('detail', (101, 102)),
]
print('StockPulse transition rollback/reconciliation tests passed')
