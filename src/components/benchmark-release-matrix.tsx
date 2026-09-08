'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { BenchmarkSuiteKey, PublicBenchmarkModel } from '@/lib/benchmarks/public-release'

const SUITES: Array<{ key: BenchmarkSuiteKey; label: string }> = [
  { key: 'performance', label: 'Performance' },
  { key: 'server_performance', label: 'Server' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'coding', label: 'Coding' },
  { key: 'tool_call', label: 'Tool-call' },
  { key: 'agent_single', label: 'Agent-single' },
  { key: 'agent_multi', label: 'Agent-multi' },
]

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function percent(value: unknown): string {
  const n = number(value)
  return n === null ? '—' : `${(n * 100).toFixed(1)}%`
}

function tps(value: unknown): string {
  const n = number(value)
  return n === null ? '—' : `${n.toFixed(1)} t/s`
}

function benchmarkMtpLabel(mode: PublicBenchmarkModel['mtp_mode']): string {
  return mode === 'mtp' ? 'MTP' : 'non-MTP'
}

function scoreCell(model: PublicBenchmarkModel, suiteKey: BenchmarkSuiteKey): string {
  const suite = record(model.suites[suiteKey])
  if (suite.status !== 'available') return '—'
  if (suiteKey === 'performance') {
    const metrics = record(suite.metrics)
    const pp = record(metrics.pp)
    const tg = record(metrics.tg)
    return `PP ${tps(pp.mean_tps)} · TG ${tps(tg.mean_tps)}`
  }
  if (suiteKey === 'server_performance') {
    const conditions = Array.isArray(suite.conditions) ? suite.conditions.map(record) : []
    const first = conditions.find(condition => condition.concurrency === 1)
    const last = conditions.find(condition => condition.concurrency === 8) || conditions.at(-1)
    const firstAgg = record(record(first).aggregate_generation_throughput_tps)
    const lastAgg = record(record(last).aggregate_generation_throughput_tps)
    return `c1 ${tps(firstAgg.mean)} · c8 ${tps(lastAgg.mean)}`
  }
  const total = number(suite.total)
  const passed = number(suite.passed) ?? number(suite.correct)
  if (total !== null && passed !== null) return `${passed}/${total} · ${percent(suite.pass_rate)}`
  return percent(suite.pass_rate)
}

function sortableScore(model: PublicBenchmarkModel, suiteKey: BenchmarkSuiteKey): number {
  const suite = record(model.suites[suiteKey])
  if (suite.status !== 'available') return -1
  if (suiteKey === 'performance') return number(record(record(suite.metrics).tg).mean_tps) ?? -1
  if (suiteKey === 'server_performance') {
    const conditions = Array.isArray(suite.conditions) ? suite.conditions.map(record) : []
    const last = conditions.find(condition => condition.concurrency === 8) || conditions.at(-1)
    return number(record(record(last).aggregate_generation_throughput_tps).mean) ?? -1
  }
  return number(suite.pass_rate) ?? -1
}

export function BenchmarkReleaseMatrix({ models }: { models: PublicBenchmarkModel[] }) {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('all')
  const [quantization, setQuantization] = useState('all')
  const [mtpMode, setMtpMode] = useState('all')
  const [sort, setSort] = useState('model')

  const families = useMemo(() => Array.from(new Set(models.map(model => model.model_family_slug))).sort(), [models])
  const familyNames = useMemo(() => new Map(models.map(model => [model.model_family_slug, model.model])), [models])
  const quantizations = useMemo(() => Array.from(new Set(models.map(model => model.quantization))).sort(), [models])

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase()
    const result = models.filter(model => {
      const matchesText = !lowered || `${model.model} ${model.variant} ${model.quantization} ${model.model_family_slug}`.toLowerCase().includes(lowered)
      const matchesFamily = family === 'all' || model.model_family_slug === family
      const matchesQuant = quantization === 'all' || model.quantization === quantization
      const matchesMtp = mtpMode === 'all' || model.mtp_mode === mtpMode
      return matchesText && matchesFamily && matchesQuant && matchesMtp
    })
    return [...result].sort((a, b) => {
      if (sort === 'tg') return sortableScore(b, 'performance') - sortableScore(a, 'performance')
      if (sort === 'knowledge') return sortableScore(b, 'knowledge') - sortableScore(a, 'knowledge')
      if (sort === 'coding') return sortableScore(b, 'coding') - sortableScore(a, 'coding')
      if (sort === 'server') return sortableScore(b, 'server_performance') - sortableScore(a, 'server_performance')
      return `${a.model} ${a.variant}`.localeCompare(`${b.model} ${b.variant}`)
    })
  }, [models, query, family, quantization, mtpMode, sort])

  return (
    <section aria-labelledby="release-matrix-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="release-matrix-heading" className="text-xl font-bold">Model comparison matrix</h2>
          <div className="mt-1 max-w-4xl space-y-1 text-sm leading-relaxed text-muted-foreground"><p>서로 다른 suite의 수치를 하나의 총점으로 합치지 않고 그대로 보여줍니다.</p><p>검색·정렬·모델군·양자화·MTP 조건으로 필요한 비교만 좁혀볼 수 있습니다.</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="sr-only" htmlFor="benchmark-model-filter">Filter models</label>
          <input id="benchmark-model-filter" value={query} onChange={event => setQuery(event.target.value)} placeholder="모델·변형 검색" className="rounded-lg border border-border bg-white px-3 py-2 text-sm dark:bg-gray-900" />
          <label className="sr-only" htmlFor="benchmark-family-filter">Filter model family</label>
          <select id="benchmark-family-filter" value={family} onChange={event => setFamily(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm dark:bg-gray-900"><option value="all">모든 모델군</option>{families.map(value => <option key={value} value={value}>{familyNames.get(value) || value}</option>)}</select>
          <label className="sr-only" htmlFor="benchmark-quant-filter">Filter quantization</label>
          <select id="benchmark-quant-filter" value={quantization} onChange={event => setQuantization(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm dark:bg-gray-900"><option value="all">모든 quantization</option>{quantizations.map(value => <option key={value} value={value}>{value}</option>)}</select>
          <label className="sr-only" htmlFor="benchmark-mtp-filter">Filter MTP mode</label>
          <select id="benchmark-mtp-filter" value={mtpMode} onChange={event => setMtpMode(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm dark:bg-gray-900"><option value="all">MTP 전체</option><option value="mtp">MTP</option><option value="non-mtp">non-MTP</option></select>
          <label className="sr-only" htmlFor="benchmark-sort">Sort benchmark models</label>
          <select id="benchmark-sort" value={sort} onChange={event => setSort(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm dark:bg-gray-900"><option value="model">모델명순</option><option value="tg">TG 속도순</option><option value="server">Server c8순</option><option value="knowledge">Knowledge순</option><option value="coding">Coding순</option></select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white dark:bg-gray-900">
        <table className="min-w-[1180px] w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground"><tr><th scope="col" className="sticky left-0 z-10 min-w-[250px] bg-muted/95 px-3 py-3 font-semibold dark:bg-gray-900/95">Model / Variant</th>{SUITES.map(suite => <th key={suite.key} scope="col" className="min-w-[140px] px-3 py-3 font-semibold">{suite.label}</th>)}</tr></thead>
          <tbody>
            {filtered.map(model => (
              <tr id={model.model_id} key={model.model_id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                <th scope="row" className="sticky left-0 z-[1] bg-white px-3 py-3 align-top dark:bg-gray-900">
                  <Link href={`/benchmarks/models/${model.model_family_slug}`} className="font-semibold no-underline hover:text-blue-600 dark:hover:text-blue-400">{model.model}</Link>
                  <div className="mt-1 text-[11px] font-normal text-muted-foreground">{model.variant} · {model.quantization}</div>
                  <div className="mt-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">{benchmarkMtpLabel(model.mtp_mode)}</div>
                </th>
                {SUITES.map(suite => {
                  const entry = model.suites[suite.key]
                  return <td key={suite.key} className="px-3 py-3 align-top leading-relaxed"><div className="font-medium">{scoreCell(model, suite.key)}</div><div className="mt-1 text-[10px] text-muted-foreground">{entry.source_type === 'revalidated_evaluator' ? 'revalidated' : 'reused'} · {entry.source_run_id}</div></td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">조건에 맞는 모델이 없습니다.</p>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{filtered.length} / {models.length} model variants · Performance는 PP/TG, Server는 c=1/c=8 aggregate throughput 기준입니다.</p>
    </section>
  )
}
