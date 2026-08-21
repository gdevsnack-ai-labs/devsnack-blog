'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Archive, ArrowUpRight, Ban, BookOpen, Check, Clock3, FileText, MessageSquare, Send, Trash2 } from 'lucide-react'
import type { ResearchCandidate, ResearchDraft } from '@/lib/research-poc'

type Snapshot = {
  drafts: ResearchDraft[]
  candidates: ResearchCandidate[]
  draftLimit: number
}

type CandidateAction = 'review' | 'defer' | 'not_interested' | 'discard' | 'memo'

const STATUS_META: Record<ResearchCandidate['status'], { label: string; className: string }> = {
  new: { label: '새 후보', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  reviewing: { label: '검토 중', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  deferred: { label: '다음에', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  not_interested: { label: '관심없음', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  promoted: { label: '정식 글 전환', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  discarded: { label: '삭제 처리', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

function formatDate(value: string | null) {
  if (!value) return '날짜 미확인'
  return new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ResearchPocClient({ initialSnapshot }: { initialSnapshot: Snapshot }) {
  const router = useRouter()
  const [memoDrafts, setMemoDrafts] = useState<Record<number, string>>(
    Object.fromEntries(initialSnapshot.candidates.map(candidate => [candidate.id, candidate.feedback || ''])),
  )
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const submitCandidateAction = async (id: number, action: CandidateAction, feedback?: string) => {
    setBusyId(id)
    setError('')
    try {
      const response = await fetch(`/api/poc/research/candidates/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || '후보군 업데이트에 실패했습니다.')
      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '후보군 업데이트에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const activeCandidates = initialSnapshot.candidates.filter(candidate => !['not_interested', 'discarded'].includes(candidate.status))
  const suppressedCount = initialSnapshot.candidates.filter(candidate => candidate.status === 'not_interested').length
  const discardedCount = initialSnapshot.candidates.filter(candidate => candidate.status === 'discarded').length

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <header className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <Archive className="h-4 w-4" />
                공개 POC 관리자 페이지
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Research Queue</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                인증을 붙이기 전 실제 데이터 흐름을 검증하는 공개 관리자 화면입니다. 현재는 에이전트 자료 수집·draft 제한·후보 피드백까지만 활성화되어 있으며, 실제 발행은 비활성화되어 있습니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href="/research" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium no-underline hover:bg-muted">
                공개 Research <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button type="button" disabled title="인증 페이즈에서 활성화됩니다" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground opacity-70">
                <Send className="h-4 w-4" /> 발행 준비중
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">미발행 정식 글</p>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{initialSnapshot.drafts.length}<span className="ml-1 text-base font-medium text-muted-foreground">/ {initialSnapshot.draftLimit}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">5개까지 정식 리서치 슬롯</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">활성 후보군</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{activeCandidates.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">키워드·카드뉴스 후보</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">관심없음 suppression</p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{suppressedCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">fingerprint 재수집 차단</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">삭제 처리</p>
            <p className="mt-2 text-3xl font-bold text-muted-foreground">{discardedCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">실제 삭제 대신 상태 보존</p>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-bold">미발행 정식 Research</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">에이전트가 작성한 관리자 검토용 초안입니다.</p>
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {initialSnapshot.drafts.length} / {initialSnapshot.draftLimit}
            </span>
          </div>

          {initialSnapshot.drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">아직 미발행 정식 글이 없습니다.</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {initialSnapshot.drafts.map(draft => (
                <article key={draft.id} className="overflow-hidden rounded-2xl border border-purple-200 bg-card shadow-sm dark:border-purple-900/50">
                  <div className="border-b border-border bg-purple-50/70 p-5 dark:bg-purple-950/20">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-purple-100 px-2.5 py-1 font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">DRAFT</span>
                      <span>{formatDate(draft.published)}</span>
                      <span>·</span>
                      <span>{draft.source_type}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-snug">{draft.title}</h3>
                    {draft.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{draft.excerpt}</p>}
                  </div>
                  <div className="p-5">
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">{draft.content}</pre>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(draft.labels || []).map(label => <span key={label} className="rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">{label}</span>)}
                      </div>
                      <button type="button" disabled title="인증 및 Publisher 페이즈에서 활성화됩니다" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground opacity-60">
                        <Send className="h-3.5 w-3.5" /> 검토 후 발행
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold">후보군</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">정식 글 슬롯이 가득 찬 뒤 저장된 짧은 주제 자료입니다.</p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">전체 {initialSnapshot.candidates.length}</span>
          </div>

          {initialSnapshot.candidates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">아직 후보군이 없습니다. Scout/Researcher를 실행하면 여기에 쌓입니다.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {initialSnapshot.candidates.map(candidate => {
                const status = STATUS_META[candidate.status]
                const isBusy = busyId === candidate.id
                const isClosed = candidate.status === 'not_interested' || candidate.status === 'discarded'
                return (
                  <article key={candidate.id} className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${isClosed ? 'opacity-70' : ''}`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{candidate.kind === 'cardnews' ? '카드뉴스' : '키워드'}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(candidate.created_at)}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-snug">{candidate.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{candidate.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {candidate.keywords.map(keyword => <span key={keyword} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">#{keyword}</span>)}
                    </div>
                    {candidate.source_urls.length > 0 && (
                      <div className="mt-4 space-y-1 text-xs">
                        {candidate.source_urls.slice(0, 3).map(source => <a key={source} href={source} target="_blank" rel="noopener noreferrer" className="block truncate text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">{source}</a>)}
                      </div>
                    )}
                    {candidate.card_slides && candidate.card_slides.length > 0 && (
                      <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                        {candidate.card_slides.map((slide, index) => <p key={`${candidate.id}-slide-${index}`} className="mb-1 last:mb-0"><strong>{index + 1}장.</strong> {slide.heading || slide.body || '내용 없음'}</p>)}
                      </div>
                    )}
                    <div className="mt-5 border-t border-border pt-4">
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground" htmlFor={`memo-${candidate.id}`}>
                        <MessageSquare className="h-3.5 w-3.5" /> 관리자 메모
                      </label>
                      <textarea
                        id={`memo-${candidate.id}`}
                        value={memoDrafts[candidate.id] ?? ''}
                        onChange={event => setMemoDrafts(prev => ({ ...prev, [candidate.id]: event.target.value }))}
                        rows={2}
                        placeholder="검토 의견이나 다음 조사 방향을 남겨두세요."
                        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" disabled={isBusy || isClosed} onClick={() => submitCandidateAction(candidate.id, 'review')} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-3.5 w-3.5" /> 검토</button>
                        <button type="button" disabled={isBusy || isClosed} onClick={() => submitCandidateAction(candidate.id, 'defer', memoDrafts[candidate.id])} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><Clock3 className="h-3.5 w-3.5" /> 다음에</button>
                        <button type="button" disabled={isBusy || isClosed} onClick={() => submitCandidateAction(candidate.id, 'not_interested', memoDrafts[candidate.id])} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"><Ban className="h-3.5 w-3.5" /> 관심없음</button>
                        <button type="button" disabled={isBusy || isClosed} onClick={() => submitCandidateAction(candidate.id, 'discard', memoDrafts[candidate.id])} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> 삭제</button>
                        <button type="button" disabled={isBusy} onClick={() => submitCandidateAction(candidate.id, 'memo', memoDrafts[candidate.id])} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><MessageSquare className="h-3.5 w-3.5" /> 메모 저장</button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
