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

for failure_mode in ('patch', 'verify'):
    failure_state = {1: 'live', 2: 'live'}
    failure_verify_calls = []

    def failure_patch(ids, lifecycle):
        for item in ids:
            failure_state[item] = lifecycle
        if failure_mode == 'patch' and lifecycle == 'consolidated':
            raise RuntimeError('synthetic patch failure')

    def failure_verify(ids, expected):
        failure_verify_calls.append(expected)
        if failure_mode == 'verify' and expected == 'consolidated':
            raise RuntimeError('synthetic verify failure')
        assert all(failure_state[item] == expected for item in ids)

    try:
        transition_with_reconciliation(
            ids=[1, 2],
            target_slugs={'a', 'b'},
            patch_fn=failure_patch,
            verify_fn=failure_verify,
            refresh_fn=lambda: None,
            wait_fn=lambda *_: None,
        )
    except PipelineError as exc:
        assert 'rollback succeeded' in str(exc)
    else:
        raise AssertionError(f'{failure_mode} failure must surface')
    assert failure_state == {1: 'live', 2: 'live'}
    assert failure_verify_calls[-1] == 'live'

print('AI Tech lifecycle rollback tests passed')
