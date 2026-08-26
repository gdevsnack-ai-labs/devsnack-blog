import { buildRouteMetadata } from '@/lib/seo/metadata'
import { StaticFeedPage } from '@/components/static-feed-page'

export const metadata = buildRouteMetadata({
  title: 'AI Tech — DevSnack',
  description: 'AI Tech v1 자동 발행 실험의 기록과 현재 source·evidence pipeline 재정비 상태를 안내합니다.',
  canonicalPath: '/aitech',
})

export const dynamic = 'force-static'
export const revalidate = false

export default function AItechPage() {
  return <StaticFeedPage kind="aitech" />
}
