import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { supabase } from '@/lib/supabase'
import type { KnowledgePostInput } from '@/lib/ia/hub-projections'

export async function getKnowledgePosts(): Promise<KnowledgePostInput[]> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published, updated, blog_id, status')
    .eq('blog_id', 'research')
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(200)

  return (data || []) as KnowledgePostInput[]
}

export async function getLatestPost(blogId: 'aitech' | 'stockpulse') {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, published, updated')
    .eq('blog_id', blogId)
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(1)

  return data?.[0] || null
}

export async function getLatestMiningMeasurement() {
  const { data } = await supabase
    .from('mining_scores')
    .select('measured_at, score')
    .order('id', { ascending: false })
    .limit(1)

  return data?.[0] || null
}

interface RealEstateRegionRow {
  region_name?: string
  year_month?: string
}

export async function getRealEstateSnapshot() {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'realestate', 'regions.json')
    const raw = await readFile(file, 'utf8')
    const rows = JSON.parse(raw) as RealEstateRegionRow[]
    const latestYearMonth = rows
      .map(row => row.year_month || '')
      .filter(Boolean)
      .sort()
      .at(-1)

    return {
      available: true,
      recordCount: rows.length,
      latestData: latestYearMonth ? `${latestYearMonth.slice(0, 4)}.${latestYearMonth.slice(4)}` : null,
    }
  } catch {
    return { available: false, recordCount: 0, latestData: null }
  }
}

export async function getDataHubSnapshot() {
  const [aiTech, stockPulse, realEstate, mining] = await Promise.all([
    getLatestPost('aitech'),
    getLatestPost('stockpulse'),
    getRealEstateSnapshot(),
    getLatestMiningMeasurement(),
  ])

  return { aiTech, stockPulse, realEstate, mining }
}
