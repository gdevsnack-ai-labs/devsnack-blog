import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildRouteMetadata({
  title: 'Real Estate Tracker — DevSnack',
  description: 'MOLIT 실거래 데이터를 지역·단지별로 확인하는 DevSnack Data Tracker',
  canonicalPath: '/realestate',
})

export default function RealEstateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
