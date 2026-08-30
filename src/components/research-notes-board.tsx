import { ArrowUpRight, ExternalLink } from 'lucide-react'
import type { ResearchNote } from '@/data/research-notes'

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
    <div className="whitespace-nowrap text-xs text-muted-foreground">
      <div>{note.published_date}</div>
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
          Promoted asset <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

export function ResearchNotesBoard({ notes }: { notes: ResearchNote[] }) {
  return (
    <section className="mt-12" aria-labelledby="research-notes-board-heading">
      <div className="mb-4">
        <h2 id="research-notes-board-heading" className="text-xl font-bold">Research Notes Board</h2>
        <p className="mt-1 text-sm text-muted-foreground">조사 단계와 다음 검증 상태를 보여주는 공개 Notebook 목록입니다. 상세 Note는 외부 GitHub Pages에서 열립니다.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white dark:bg-gray-900">
        <div className="md:hidden">
          <ul className="divide-y divide-border" aria-label="Research Notes list">
            {notes.map(note => (
              <li key={note.external_url} className="min-w-0 p-4">
                <div className="flex items-start justify-between gap-3">
                  <DateCell note={note} />
                  <StatusBadge status={note.status} />
                </div>
                <div className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{CATEGORY_LABEL[note.category]}</div>
                <h3 className="mt-1 text-sm font-bold leading-snug">{note.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{note.summary}</p>
                <div className="mt-3"><NoteLinks note={note} /></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Research Notes Board</caption>
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Title / Summary</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notes.map(note => (
                <tr key={note.external_url} className="align-top">
                  <td className="px-4 py-4"><DateCell note={note} /></td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-muted-foreground">{CATEGORY_LABEL[note.category]}</td>
                  <td className="min-w-[320px] px-4 py-4">
                    <div className="font-bold leading-snug">{note.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note.summary}</p>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={note.status} /></td>
                  <td className="px-4 py-4"><NoteLinks note={note} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
