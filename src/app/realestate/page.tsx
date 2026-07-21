'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { BlogHeader } from '@/components/blog-header'
import { 
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type RegionPrice = {
  sigungu_code: string
  region_name: string
  property_type: string
  trade_type: string
  year_month: string
  avg_price: number
  median_price: number
  trade_count: number
  price_change_pct: number
}

type ComplexPrice = {
  sigungu_code: string
  region_name: string
  apt_name: string
  property_type: string
  trade_type: string
  year_month: string
  avg_price: number | null
  median_price: number | null
  min_price: number | null
  max_price: number | null
  trade_count: number
  price_change_pct: number | null
}

type ComplexSummary = {
  sigungu_code: string
  region_name: string
  apt_name: string
  trade_type: string
  avg_price: number | null
  total_deals: number
  last_month: string
}

type TradeDetail = {
  ym: string
  date: string
  type: string
  area: number
  floor: string
  price: number
  monthly_rent: number
}

const TRADE_TYPES = ['매매', '전세', '반전세', '월세'] as const
type TradeType = typeof TRADE_TYPES[number]

function priceLabel(t: TradeType): string {
  if (t === '매매') return '평균가'
  if (t === '반전세' || t === '월세') return '월 평균 월세'
  return '보증금'
}
function priceSuffix(t: TradeType): string {
  if (t === '매매' || t === '전세') return '만원'
  return '만원/월'
}
function formatPrice(v: number | null | undefined, t: TradeType): string {
  if (v == null) return t === '전세' ? '-' : '0'
  return v.toLocaleString()
}

export default function RealEstatePage() {
  const [regions, setRegions] = useState<RegionPrice[]>([])
  const [complexes, setComplexes] = useState<ComplexPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedTradeType, setSelectedTradeType] = useState<TradeType>('매매')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedComplex, setSelectedComplex] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [allTrades, setAllTrades] = useState<Record<string, TradeDetail[]> | null>(null)
  const [clickedMonth, setClickedMonth] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'deals' | 'price'>('deals')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/data/realestate/regions.json').then(r => r.json()),
      fetch('/data/realestate/complexes.json').then(r => r.json()),
    ]).then(([r, c]) => {
      setRegions(r)
      setComplexes(c)
      setLoading(false)
    })
  }, [])

  // Lazy load complex_trades when modal opens
  useEffect(() => {
    if (selectedComplex && !allTrades) {
      fetch('/data/realestate/complex_trades.json')
        .then(r => r.json())
        .then(setAllTrades)
    }
  }, [selectedComplex, allTrades])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Aggregate ──
  const complexSummary = useMemo(() => {
    const agg = new Map<string, { sumCnt: number; sumPrice: number; maxMonth: string; lastPrice: number | null }>()
    for (const c of complexes) {
      if (!c.trade_count || c.trade_count <= 0) continue
      const key = `${c.sigungu_code}|${c.apt_name}|${c.trade_type}`
      const e = agg.get(key) || { sumCnt: 0, sumPrice: 0, maxMonth: '', lastPrice: null }
      e.sumCnt += c.trade_count
      if (c.avg_price) e.sumPrice += c.avg_price * c.trade_count
      if (c.year_month > e.maxMonth) { e.maxMonth = c.year_month; e.lastPrice = c.avg_price }
      agg.set(key, e)
    }
    return Array.from(agg.entries()).map(([key, v]) => {
      const [sigungu_code, apt_name, trade_type] = key.split('|')
      const fm = complexes.find(c => c.sigungu_code === sigungu_code && c.apt_name === apt_name && c.trade_type === trade_type)
      return {
        sigungu_code, region_name: fm?.region_name ?? '', apt_name, trade_type,
        avg_price: v.sumCnt > 0 ? Math.round(v.sumPrice / v.sumCnt) : null,
        total_deals: v.sumCnt, last_month: v.maxMonth,
      } as ComplexSummary
    })
  }, [complexes])

  const searchResults = useMemo(() => {
    const filtered = complexSummary.filter(c => c.trade_type === selectedTradeType)
    if (!searchTerm) return filtered.sort((a, b) => b.total_deals - a.total_deals).slice(0, 10)
    const term = searchTerm.toLowerCase()
    return filtered.filter(c => c.apt_name.toLowerCase().includes(term) || c.region_name.includes(term))
      .sort((a, b) => b.total_deals - a.total_deals).slice(0, 15)
  }, [searchTerm, complexSummary, selectedTradeType])

  const complexData: ComplexPrice[] = useMemo(() => {
    if (!selectedComplex) return []
    return complexes.filter(c => c.apt_name === selectedComplex && c.trade_type === selectedTradeType)
      .sort((a, b) => a.year_month.localeCompare(b.year_month))
  }, [selectedComplex, complexes, selectedTradeType])

  const complexChartData = complexData.map(d => ({
    year_month: d.year_month,
    '가격': d.avg_price ?? 0,
    '거래량': d.trade_count,
  }))

  // ── Scatter data for modal ──
  const scatterData = useMemo(() => {
    if (!selectedComplex || !allTrades) return []
    const trades = allTrades[selectedComplex] || []
    return trades
      .filter(t => t.type === selectedTradeType && t.area > 0)
      .map(t => ({
        area: t.area,
        price: t.price,
        date: t.date,
        floor: t.floor,
      }))
  }, [selectedComplex, allTrades, selectedTradeType])

  // ── Trade detail for clicked month ──
  const monthTrades = useMemo(() => {
    if (!clickedMonth || !selectedComplex || !allTrades) return []
    return (allTrades[selectedComplex] || [])
      .filter(t => t.ym === clickedMonth && t.type === selectedTradeType)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [clickedMonth, selectedComplex, allTrades, selectedTradeType])

  const handleMonthClick = useCallback((data: any) => {
    if (data?.activeLabel) {
      setClickedMonth(data.activeLabel)
    }
  }, [])

  if (loading) return (
    <div className="min-h-screen">
      <BlogHeader title="부동산 실거래" subtitle="AI가 분석하는 아파트 실거래가 동향" icon="realestate" color="orange" />
      <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">데이터 로딩 중...</p></div>
    </div>
  )

  const regionNames = [...new Set(regions.map(r => r.region_name))]
  const filtered = regions.filter(r => (selectedRegion === 'all' || r.region_name === selectedRegion) && r.trade_type === selectedTradeType)
  const latestPerRegion = regionNames.map(name => {
    const rd = regions.filter(r => r.region_name === name && r.trade_type === selectedTradeType)
    return rd.sort((a, b) => b.year_month.localeCompare(a.year_month))[0]
  }).filter(Boolean) as RegionPrice[]
  const trendData = filtered.sort((a, b) => a.year_month.localeCompare(b.year_month))
    .reduce((acc, row) => {
      const e = acc.find(a => a.year_month === row.year_month)
      if (e) { e[`${row.region_name}`] = row.avg_price }
      else { acc.push({ year_month: row.year_month, [row.region_name]: row.avg_price }) }
      return acc
    }, [] as Record<string, any>[])
  const volumeData = latestPerRegion.map(r => ({ region: r.region_name, count: r.trade_count || 0, avg: r.avg_price }))
  const topComplexes = complexSummary.filter(c => c.trade_type === selectedTradeType)
    .sort((a, b) => {
      const dir = sortDesc ? -1 : 1
      if (sortBy === 'price') return ((a.avg_price ?? 0) - (b.avg_price ?? 0)) * dir
      return (a.total_deals - b.total_deals) * dir
    }).slice(0, 50)

  return (
    <div className="min-h-screen">
      <BlogHeader title="부동산 실거래" subtitle="AI가 분석하는 아파트 실거래가 동향" icon="realestate" color="orange" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* ── 필터 ── */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-white dark:bg-gray-900 text-sm">
            <option value="all">전체 지역</option>
            {regionNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <div className="flex rounded-lg border overflow-hidden">
            {TRADE_TYPES.map(t => (
              <button key={t} onClick={() => setSelectedTradeType(t)}
                className={`px-3 py-1.5 text-sm transition-colors ${selectedTradeType === t ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{t}</button>
            ))}
          </div>
          <div ref={searchRef} className="relative flex-1 min-w-[200px] max-w-sm">
            <input type="text" placeholder="단지명 검색..." value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-gray-900 text-sm" />
            {showSuggestions && searchTerm && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((c, i) => (
                  <button key={`${c.sigungu_code}|${c.apt_name}|${i}`}
                    onClick={() => { setSelectedComplex(c.apt_name); setSearchTerm(c.apt_name); setShowSuggestions(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors ${selectedComplex === c.apt_name ? 'bg-orange-50 dark:bg-gray-800 font-medium' : ''}`}>
                    <span className="font-medium">{c.apt_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{c.region_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{c.total_deals}건</span>
                  </button>
                ))}
                {searchResults.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">검색 결과 없음</div>}
              </div>
            )}
          </div>
        </div>

        {/* ── 지역 추세 ── */}
        <h2 className="text-2xl font-bold mb-4">{selectedTradeType} 추세{selectedRegion !== 'all' && ` — ${selectedRegion}`}</h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">지역별 {priceLabel(selectedTradeType)} 추세</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year_month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}${priceSuffix(selectedTradeType)}`} /><Legend />
              {regionNames.filter(n => selectedRegion === 'all' || n === selectedRegion).map((name, i) => (
                <Line key={name} type="monotone" dataKey={name}
                  stroke={['#f97316', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'][i % 5]} strokeWidth={2} dot={false} name={name} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── 지역별 거래량 + 통계 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">지역별 거래량</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="region" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}건`} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="거래량" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">지역별 {selectedTradeType} 현황</h3>
            <div className="space-y-3">
              {latestPerRegion.slice(0, 5).map(r => (
                <div key={r.region_name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div><div className="font-medium">{r.region_name}</div><div className="text-xs text-muted-foreground">{r.year_month?.slice(0, 4)}년 {r.year_month?.slice(4)}월</div></div>
                  <div className="text-right">
                    <div className="font-bold">{r.avg_price?.toLocaleString() ?? '-'}{priceSuffix(selectedTradeType)}</div>
                    <div className={`text-xs ${(r.price_change_pct || 0) >= 0 ? 'text-red-500' : 'text-blue-500'}`}>{(r.price_change_pct || 0) >= 0 ? '▲' : '▼'} {Math.abs(r.price_change_pct || 0).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 단지 목록 ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">거래량 TOP 단지 <span className="text-xs ml-2">(단지명 클릭하면 상세 차트)</span></h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">단지명</th><th className="pb-2 font-medium">지역</th>
                <th className="pb-2 font-medium text-right cursor-pointer hover:text-foreground select-none"
                    onClick={() => { if (sortBy === 'price') setSortDesc(!sortDesc); else { setSortBy('price'); setSortDesc(true) } }}>
                  {priceLabel(selectedTradeType)} {sortBy === 'price' ? (sortDesc ? '▼' : '▲') : '⇅'}
                </th>
                <th className="pb-2 font-medium text-right cursor-pointer hover:text-foreground select-none"
                    onClick={() => { if (sortBy === 'deals') setSortDesc(!sortDesc); else { setSortBy('deals'); setSortDesc(true) } }}>
                  누적거래 {sortBy === 'deals' ? (sortDesc ? '▼' : '▲') : '⇅'}
                </th>
              </tr></thead>
              <tbody>
                {topComplexes.map((c, i) => (
                  <tr key={`${c.sigungu_code}|${c.apt_name}|${i}`}
                    onClick={() => { setSelectedComplex(c.apt_name); setSearchTerm(c.apt_name) }}
                    className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-orange-50 dark:hover:bg-gray-800 ${selectedComplex === c.apt_name ? 'bg-orange-50 dark:bg-gray-800' : ''}`}>
                    <td className="py-2 font-medium">{c.apt_name}</td><td className="py-2 text-muted-foreground">{c.region_name}</td>
                    <td className="py-2 text-right">{formatPrice(c.avg_price, selectedTradeType)}{priceSuffix(selectedTradeType)}</td>
                    <td className="py-2 text-right">{c.total_deals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 모달 ── */}
        {selectedComplex && complexChartData.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => { setSelectedComplex(null); setSearchTerm(''); setClickedMonth(null) }}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4 p-6"
              onClick={e => e.stopPropagation()}>
              
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{selectedComplex}</h3>
                  <span className="px-2 py-0.5 text-xs rounded-full border bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-medium">{selectedTradeType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border overflow-hidden text-sm">
                    {TRADE_TYPES.map(t => (
                      <button key={t} onClick={() => { setSelectedTradeType(t); setClickedMonth(null) }}
                        className={`px-2.5 py-1 text-xs transition-colors ${selectedTradeType === t ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{t}</button>
                    ))}
                  </div>
                  <button onClick={() => { setSelectedComplex(null); setSearchTerm(''); setClickedMonth(null) }}
                    className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border text-sm ml-1">✕</button>
                </div>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">최근 {priceLabel(selectedTradeType)}</div>
                  <div className="text-lg font-bold">{formatPrice(complexData[complexData.length - 1]?.avg_price, selectedTradeType)}{priceSuffix(selectedTradeType)}</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">누적 거래</div>
                  <div className="text-lg font-bold">{complexData.reduce((s, d) => s + (d.trade_count || 0), 0)}건</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">거래 단지</div>
                  <div className="text-lg font-bold">{scatterData.length}건</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">데이터 기간</div>
                  <div className="text-lg font-bold text-sm pt-0.5">
                    {complexData[0]?.year_month?.slice(0, 4)}.{complexData[0]?.year_month?.slice(4)}~{complexData[complexData.length - 1]?.year_month?.slice(0, 4)}.{complexData[complexData.length - 1]?.year_month?.slice(4)}
                  </div>
                </div>
              </div>

              {/* 차트 3개 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">{priceLabel(selectedTradeType)} 추세 (월 클릭 시 상세)</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={complexChartData} onClick={handleMonthClick}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year_month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}${priceSuffix(selectedTradeType)}`} /><Legend />
                      <Line type="monotone" dataKey="가격" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name={priceLabel(selectedTradeType)} activeDot={{ r: 6, onClick: (e: any) => e?.payload && setClickedMonth(e.payload.year_month) }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">월별 거래량</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={complexChartData} onClick={handleMonthClick}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year_month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}건`} />
                      <Bar dataKey="거래량" fill="#22c55e" radius={[4, 4, 0, 0]} name="거래량" onClick={(e: any) => e?.payload && setClickedMonth(e.payload.year_month)} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 산점도 */}
              {scatterData.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">전용면적별 가격 분포</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="area" name="전용면적" unit="㎡" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="price" name="가격" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}만원`} />
                      <Scatter data={scatterData} fill="#f97316" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 선택한 월 실거래 테이블 */}
              {clickedMonth && monthTrades.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    {clickedMonth.slice(0, 4)}년 {clickedMonth.slice(4)}월 실거래 ({monthTrades.length}건)
                  </h4>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr className="text-left text-muted-foreground">
                          <th className="px-3 py-2 font-medium">날짜</th>
                          <th className="px-3 py-2 font-medium">유형</th>
                          <th className="px-3 py-2 font-medium">전용면적</th>
                          <th className="px-3 py-2 font-medium">층</th>
                          <th className="px-3 py-2 font-medium text-right">가격</th>
                          <th className="px-3 py-2 font-medium text-right">월세</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthTrades.map((t, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-1.5 whitespace-nowrap">{t.date}</td>
                            <td className="px-3 py-1.5">
                              <span className="px-1.5 py-0.5 text-xs rounded border text-muted-foreground">{t.type}</span>
                            </td>
                            <td className="px-3 py-1.5">{t.area?.toFixed(1)}㎡</td>
                            <td className="px-3 py-1.5">{t.floor}층</td>
                            <td className="px-3 py-1.5 text-right font-medium">{t.price?.toLocaleString()}만</td>
                            <td className="px-3 py-1.5 text-right text-muted-foreground">{t.monthly_rent > 0 ? `${t.monthly_rent}만` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          부동산 실거래 데이터 — 국토교통부 API 기반 | 업데이트: 매일 08:00
        </div>
      </footer>
    </div>
  )
}
