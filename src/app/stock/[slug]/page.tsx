import { notFound, permanentRedirect } from 'next/navigation'
import { getStockPulseExternalReport } from '@/lib/stockpulse-migration'

export const dynamic = 'force-static'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const report = getStockPulseExternalReport(slug)
  if (!report) return { title: 'StockPulse Report Not Found', robots: { index: false, follow: false } }
  return {
    title: `${report.title} · StockPulse Publication`,
    robots: { index: false, follow: false },
  }
}

export default async function StockPostRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const report = getStockPulseExternalReport(slug)
  if (!report) notFound()
  permanentRedirect(report.external_url)
}
