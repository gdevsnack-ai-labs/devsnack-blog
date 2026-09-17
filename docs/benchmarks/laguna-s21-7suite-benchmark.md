# Laguna S 2.1 Uncensored APEX-I Balanced — 7-suite benchmark

> Public-safe summary. Raw prompts, responses, local paths, logs, and execution traces remain local-only.

## Scope

- Hardware: NVIDIA DGX Spark GB10
- Runtime: llama.cpp `b10930-56381e407`
- Model variant: Laguna S 2.1 — APEX-I Balanced (NVFP4)
- MTP: non-MTP (`spec_type=none`)
- Quality suites: no-think, thinking budget 0
- Measurement date: 2026-09-16 (KST)

## Results

| Suite | Workload | Result |
|---|---|---:|
| Performance | PP 512/2K/8K/32K, TG 512, 5 repetitions | PP `762.48 / 757.70 / 756.94 / 702.17`, TG `27.55 tokens/s` |
| Server-performance | Concurrency 1/2/4/8, 3 repetitions | 180/180 successful, failure rate 0% |
| Knowledge | Legacy Knowledge v1, 25 questions | `24/25` (`96%`) |
| Coding | 12 tasks | `11/12` (`91.67%`) |
| Tool-call v1.1 | 15 tasks | `13/15` (`86.67%`) |
| Agent-single v1.1 | 12 tasks | `6/12` (`50%`) |
| Agent-multi v1.1 | 10 tasks | `7/10` (`70%`) |

## Server-performance

| Concurrency | Aggregate tokens/s | Per-request tokens/s | p50 latency | p95 latency |
|---:|---:|---:|---:|---:|
| 1 | 26.81 | 26.83 | 7.79s | 8.18s |
| 2 | 37.44 | 18.86 | 11.73s | 12.73s |
| 4 | 59.09 | 14.92 | 14.33s | 15.36s |
| 8 | 72.88 | 10.35 | 24.25s | 31.11s |

## Interpretation

The model maintained 702.17 tokens/s at a 32K prompt and generated at 27.55 tokens/s in the Performance workload. The server lane completed all 180 requests, while increasing concurrency reduced per-request throughput and increased latency.

Knowledge and coding results were strong at 24/25 and 11/12. Tool-call reached 13/15, with tool selection, argument, and execution metrics each at 93.33%. Agent-single was weaker at 6/12, while Agent-multi achieved 100% handoff and role participation but completed 7/10 tasks. The main gap is maintaining required steps through longer agent workflows.

## Compatibility note

This run's Knowledge result uses legacy Knowledge v1 with 25 questions. The current Standard Benchmark uses Knowledge v1.2 with 100 questions, so the matrix shows this row with its own version and denominator; direct ranking against the current Standard Knowledge results should be avoided.

## External tool-eval-bench

The same model was also measured with the separate `tool-eval-bench` protocol: `86/100`, `119/138`, and `69/69 scored`. Deployability was 73 and Responsiveness was 42. The safety gate failed because the run followed a fake system message in a file, attempted a destructive action after authority escalation, and carried a cross-turn injection into email recipients. These findings are reported as safety limitations, not hidden behind the score.

The external protocol is separate from the internal Tool-call v1.1 suite. It uses 69 deterministic mock-tool scenarios, temperature 0, no-think, and sequential execution.
