#!/usr/bin/env python3
from aitech_weekly_pipeline import (
    lifecycle_preflight,
    transition_with_reconciliation,
    PipelineError,
)

assert lifecycle_preflight([
    {'id': 1, 'status': 'live', 'lifecycle_status': 'live'},
    {'id': 2, 'status': 'live', 'lifecycle_status': 'live'},
]) == 'ready'
assert lifecycle_preflight([
    {'id': 1, 'status': 'live', 'lifecycle_status': 'consolidated'},
]) == 'already_consolidated'
try:
    lifecycle_preflight([
        {'id': 1, 'status': 'live', 'lifecycle_status': 'live'},
        {'id': 2, 'status': 'live', 'lifecycle_status': 'consolidated'},
    ])
except PipelineError:
    pass
else:
    raise AssertionError('mixed lifecycle state must fail')

state = {1: 'live', 2: 'live'}
snapshot_calls = []
verify_calls = []
wait_calls = []

def patch(ids, lifecycle):
    for item in ids:
        state[item] = lifecycle

def verify(ids, expected):
    verify_calls.append((tuple(ids), expected))
    assert all(state[item] == expected for item in ids)

def refresh():
    snapshot_calls.append(len(snapshot_calls))
    if len(snapshot_calls) == 1:
        raise RuntimeError('synthetic snapshot failure')

def wait(target_slugs, should_contain):
    wait_calls.append((target_slugs, should_contain))

try:
    transition_with_reconciliation(
        ids=[1, 2],
        target_slugs={'a', 'b'},
        patch_fn=patch,
        verify_fn=verify,
        refresh_fn=refresh,
        wait_fn=wait,
    )
except PipelineError as exc:
    assert 'rollback succeeded' in str(exc)
else:
    raise AssertionError('synthetic transition failure must surface')

assert state == {1: 'live', 2: 'live'}
assert len(snapshot_calls) == 2
assert verify_calls[-1] == ((1, 2), 'live')
assert wait_calls[-1] == ({'a', 'b'}, True)

print('AI Tech lifecycle rollback tests passed')
