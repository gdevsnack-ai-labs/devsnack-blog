import { buildRouteMetadata } from '@/lib/seo/metadata'
import { StaticFeedPage } from '@/components/static-feed-page'

export const metadata = buildRouteMetadata({
  title: 'Stories — DevSnack',
  description: '사람이 읽는 경험·해석·기술 칼럼을 모은 DevSnack Stories',
  canonicalPath: '/devsnack',
})

export const dynamic = 'force-static'
export const revalidate = false

export default function Home() {
  return <StaticFeedPage kind="devsnack" />
}
