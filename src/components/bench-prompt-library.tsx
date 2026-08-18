'use client'

import { useMemo, useState } from 'react'
import { Search, Copy, Check, ChevronDown, ChevronUp, TerminalSquare } from 'lucide-react'
import { BENCH_PROMPTS, CATEGORY_META, type BenchPrompt } from '@/data/bench-prompts'

const CATS = ['all', 'ui', 'game', 'service', 'progressive'] as const

export function BenchPromptLibrary() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<(typeof CATS)[number]>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BENCH_PROMPTS.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      )
    })
  }, [query, cat])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyPrompt = async (p: BenchPrompt) => {
    try {
      await navigator.clipboard.writeText(p.prompt)
      setCopied(p.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // 폴백: textarea 방식
      const ta = document.createElement('textarea')
      ta.value = p.prompt
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(p.id)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const catCount = (c: (typeof CATS)[number]) =>
    c === 'all' ? BENCH_PROMPTS.length : BENCH_PROMPTS.filter((p) => p.category === c).length

  return (
    <div className="border border-border rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      {/* 헤더 */}
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <TerminalSquare className="w-5 h-5 text-blue-500" />
          Self Bench Pack — 자체 설계 벤치 프롬프트 24종
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          TokenChaser의 84개 실전 벤치 프롬프트 구조를 참고해 자체 설계한 테스트 셋입니다.
          모든 프롬프트는 <strong>한국어+영어 이중언어 출력</strong>과{' '}
          <strong>자기검증 루프(생성→테스트→수정)</strong> 지시를 내장하고 있어,
          로컬 LLM 에이전트가 스스로 만들어 검증하고 고치는 능력을 측정합니다.
          프롬프트를 복사해 직접 테스트해볼 수 있습니다.
        </p>
      </div>

      {/* 검색 + 필터 */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·설명·프롬프트 내용 검색… (예: 주식, 오목, 날씨, Phase)"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                cat === c
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-transparent text-muted-foreground border-border hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {c === 'all' ? '전체' : `${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`}
              <span className="ml-1 opacity-70">({catCount(c)})</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {cat !== 'all' ? CATEGORY_META[cat].desc + ' · ' : ''}
          검색 결과 {filtered.length} / {BENCH_PROMPTS.length}개
        </p>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다. 다른 키워드로 검색해보세요.
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-[720px] overflow-y-auto">
          {filtered.map((p) => {
            const meta = CATEGORY_META[p.category]
            const isOpen = expanded.has(p.id)
            const isCopied = copied === p.id
            return (
              <li key={p.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {p.id}
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-sm font-semibold">{p.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyPrompt(p)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                        isCopied
                          ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                          : 'border-border text-muted-foreground hover:text-blue-600 hover:border-blue-400'
                      }`}
                      title="프롬프트 복사"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? '복사됨' : '복사'}
                    </button>
                    <button
                      onClick={() => toggle(p.id)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-blue-600 hover:border-blue-400 transition-colors"
                      title={isOpen ? '접기' : '프롬프트 전문 보기'}
                    >
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isOpen ? '접기' : '전문'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-950 border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-900 border-b border-border">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {p.prompt.length.toLocaleString()}자 · 이중언어 + 자기검증 지시 포함
                      </span>
                    </div>
                    <pre className="p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 max-h-80 overflow-y-auto">
                      {p.prompt}
                    </pre>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}