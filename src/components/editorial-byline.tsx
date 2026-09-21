import { humanReviewLabel, normalizeProvenance, sourceCountLabel } from '@/lib/provenance'

export type EditorialContext = 'article' | 'research' | 'lab'

const CONTEXT_LABEL: Record<EditorialContext, string> = {
  article: '원문·측정 조건·검수 범위는 본문에 기록',
  research: '직접 조사·실행 범위는 본문 결과와 한계에 기록',
  lab: '직접 실행·측정·판단 기록',
}

export function EditorialByline({
  context,
  provenance,
}: {
  context: EditorialContext
  provenance?: unknown
}) {
  const normalized = normalizeProvenance(provenance)
  const details = normalized
    ? [humanReviewLabel(normalized), sourceCountLabel(normalized)].filter(Boolean) as string[]
    : [CONTEXT_LABEL[context]]

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground" aria-label="작성 주체와 콘텐츠 provenance">
      <span>작성 DevSnack Lab</span>
      <span aria-hidden="true">·</span>
      {details.map(detail => <span key={detail}>{detail}</span>)}
    </div>
  )
}
