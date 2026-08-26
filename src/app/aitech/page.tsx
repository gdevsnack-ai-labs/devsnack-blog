import { buildRouteMetadata } from '@/lib/seo/metadata'
import { StaticFeedPage } from '@/components/static-feed-page'

export const metadata = buildRouteMetadata({
  title: 'AI Tech — DevSnack',
  description: '자동 수집·정리되는 AI 기술과 산업 동향 Feed',
  canonicalPath: '/aitech',
})

export const dynamic = 'force-static'
export const revalidate = false

export default function AItechPage() {
  return <StaticFeedPage kind="aitech" />
}
