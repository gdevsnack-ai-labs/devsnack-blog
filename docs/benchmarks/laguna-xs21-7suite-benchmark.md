# Laguna XS 2.1 — canonical 7-suite benchmark

> Public-safe summary. Raw prompts, responses, local model paths, logs, and execution traces remain local-only.

## Scope

- Hardware: NVIDIA DGX Spark GB10
- Runtime: llama.cpp `b10930-56381e407`
- Model family: Laguna XS 2.1
- Variants: Q4_K_M, Q5_K_M, Q6_K_L, Q8_0
- MTP: non-MTP (`spec_type=none`)
- Quality suites: no-think, thinking budget 0
- Knowledge: current Knowledge v1.2, 100 questions
- Measurement date: 2026-09-17 (KST)

## Quality results

| Variant | Knowledge v1.2 (100) | Coding (12) | Tool-call (15) | Agent-single (12) | Agent-multi (10) |
|---|---:|---:|---:|---:|---:|
| Q4_K_M | 85 (85%) | 12 (100%) | 13 (86.67%) | 6 (50%) | 9 (90%) |
| Q5_K_M | 88 (88%) | 12 (100%) | 13 (86.67%) | 6 (50%) | 9 (90%) |
| Q6_K_L | 88 (88%) | 12 (100%) | 13 (86.67%) | 5 (41.67%) | 9 (90%) |
| Q8_0 | 84 (84%) | 12 (100%) | 13 (86.67%) | 5 (41.67%) | 9 (90%) |

Knowledge category results were general `20/20` for all variants. The remaining category results were Korea / math / science / logic: Q4 `18/20 / 14/20 / 19/20 / 14/20`, Q5 `19/20 / 16/20 / 20/20 / 13/20`, Q6 `16/20 / 16/20 / 20/20 / 16/20`, and Q8 `18/20 / 14/20 / 19/20 / 13/20`.

## Performance

Values are means over five repetitions. Columns are PP512 / PP2K / PP8K / PP32K / TG512 in tokens/s.

| Variant | PP512 | PP2K | PP8K | PP32K | TG512 |
|---|---:|---:|---:|---:|---:|
| Q4_K_M | 2374.62 | 2340.13 | 2261.72 | 1915.66 | 84.23 |
| Q5_K_M | 2239.87 | 2226.15 | 2144.64 | 1838.07 | 76.84 |
| Q6_K_L | 2021.65 | 1997.41 | 1934.77 | 1675.32 | 68.23 |
| Q8_0 | 2072.65 | 2061.96 | 2011.47 | 1704.98 | 65.08 |

## Server-performance

Every variant completed the full 180-request matrix with a 0% failure rate. Values below are aggregate generation throughput in tokens/s at concurrency 1 / 2 / 4 / 8.

| Variant | c1 | c2 | c4 | c8 |
|---|---:|---:|---:|---:|
| Q4_K_M | 79.22 | 122.55 | 233.33 | 283.02 |
| Q5_K_M | 72.34 | 120.99 | 202.91 | 283.87 |
| Q6_K_L | 64.64 | 108.16 | 189.04 | 203.29 |
| Q8_0 | 62.15 | 87.04 | 156.08 | 177.55 |

## External tool-eval-bench

This is a separate protocol from the internal Tool-call v1.1 suite. All variants completed the same 69 scenarios with temperature 0, no-think, sequential execution, and no excluded scenarios.

| Variant | Final | Deployability | Responsiveness | Scored | Safety gate |
|---|---:|---:|---:|---:|---|
| Q4_K_M | 86/100 | 85 | 83 | 69/69 | WARN |
| Q5_K_M | 88/100 | 86 | 80 | 69/69 | WARN |
| Q6_K_L | 88/100 | 85 | 78 | 69/69 | WARN |
| Q8_0 | 87/100 | 84 | 77 | 69/69 | WARN |

The common safety warnings were an unnecessary duplicate event during correction and failure to reject a cross-turn sleeper injection as untrusted data. Q4 additionally received a critical warning because attacker BCC/CC data was carried into an email action. These are reported as safety limitations; the runs are not treated as safety-gate passes.

## Interpretation

Q4_K_M was the fastest variant in prompt processing and generation. Q5_K_M and Q6_K_L reached the highest Knowledge and external scores, while Q8_0 traded speed for larger quantization size without improving quality in this run. All four variants completed the server workload without failures, but the concurrency profile and latency should be read together with the selected quantization.

Coding was perfect across all four variants, Tool-call was stable at 13/15, and Agent-multi reached 9/10 for every variant. Agent-single was the main quality spread: Q4/Q5 reached 6/12, while Q6/Q8 reached 5/12. The external safety warnings mean the final score must not be read as a complete safety assessment.

## Reproducibility note

The public projection keeps compact metrics, evaluator versions, conditions, and source-run identifiers. Raw prompts, responses, server logs, local paths, and execution traces are intentionally excluded from the public release.
