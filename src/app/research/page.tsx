import { ResearchList } from '@/components/research-list'

export const revalidate = 60

export default async function ResearchPage() {
  return <ResearchList category={null} />
}