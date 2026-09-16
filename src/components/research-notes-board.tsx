import { ArrowUpRight, ExternalLink } from 'lucide-react'
import type { ResearchNote } from '@/data/research-notes'
import { RESEARCH_NOTE_NOTEBOOK_URL } from '@/lib/research-note-migration'

const CATEGORY_LABEL: Record<ResearchNote['category'], string> = {
  models: 'Models',
  tools: 'Tools',
  agents: 'Agents',
  media: 'Media',
  infra: 'Infra',
  misc: 'Misc',
}

const STATUS_LABEL: Record<ResearchNote['status'], string> = {
  'research-complete': 'Research complete',
  'experiment-candidate': 'Experiment candidate',
  'awaiting-test': 'Awaiting test',
  archived: 'Archived',
}

const STATUS_CLASS: Record<ResearchNote['status'], string> = {
  'research-complete': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'experiment-candidate': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'awaiting-test': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function DateCell({ note }: { note: ResearchNote }) {
  return (
    <div className="text-xs text-muted-foreground">
      <div>게시 {note.published_date}</div>
      {note.updated_date && <div className="mt-0.5 font-medium text-emerald-700 dark:text-emerald-300">업데이트 {note.updated_date}</div>}
      <div className="mt-0.5 text-[10px]">조사 {note.researched_date}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: ResearchNote['status'] }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
}

function NoteLinks({ note }: { note: ResearchNote }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <a
        href={note.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:text-purple-600 hover:underline dark:hover:text-purple-400"
      >
        External Notebook <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      {note.promoted_asset_url && (
        <a
          href={note.promoted_asset_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-purple-600 hover:underline dark:hover:text-purple-400"
        >
          Related asset <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

export function ResearchNotesBoard({ notes, totalCount = notes.length }: { notes: ResearchNote[]; totalCount?: number }) {
  return (
    <section className="mt-12" aria-labelledby="research-notes-board-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="research-notes-board-heading" className="text-xl font-bold">Research Notes Board</h2>
          <p className="mt-1 text-sm text-muted-foreground">최근 업데이트된 공개 Notebook을 카드로 보여줍니다. 긴 조사 원문은 외부 GitHub Pages에서 열립니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>표시 {notes.length}개 / 전체 {totalCount}개</span>
          <a href={RESEARCH_NOTE_NOTEBOOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-foreground no-underline hover:text-purple-600 hover:underline dark:hover:text-purple-400">
            Research Notebook 전체 보기 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Research Notes cards">
        {notes.map(note => (
          <article key={note.external_url} className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{CATEGORY_LABEL[note.category]}</span>
              <StatusBadge status={note.status} />
            </div>
            <div className="mt-3"><DateCell note={note} /></div>
            <h3 className="mt-3 break-words text-base font-bold leading-snug">{note.title}</h3>
            <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">{note.summary}</p>
            <div className="mt-auto pt-4"><NoteLinks note={note} /></div>
          </article>
        ))}
      </div>
    </section>
  )
}
