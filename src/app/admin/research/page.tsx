import { getResearchPocSnapshot } from '@/lib/research-poc'
import { ResearchPocClient } from './research-poc-client'

export const dynamic = 'force-dynamic'

export default async function ResearchPocPage() {
  const snapshot = await getResearchPocSnapshot()
  return <ResearchPocClient initialSnapshot={snapshot} />
}
