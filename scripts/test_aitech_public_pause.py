#!/usr/bin/env python3
from aitech_weekly_pipeline import PipelineError, publish_weekly, run_pipeline

try:
    run_pipeline('2026-08-18', '2026-08-24', publish=True, transition=False, allow_public_publish=False)
except PipelineError as exc:
    assert 'public publish is paused' in str(exc)
else:
    raise AssertionError('Weekly public publish must remain paused without explicit allow flag')

try:
    publish_weekly({'week_start': '2026-08-18', 'week_end': '2026-08-24', 'articles': []}, '')
except PipelineError as exc:
    assert 'public publish is paused' in str(exc)
else:
    raise AssertionError('direct publish_weekly must be gated')

print('AI Tech weekly public pause gate tests passed')
