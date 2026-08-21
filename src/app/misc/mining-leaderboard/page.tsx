import Link from 'next/link'
import { ArrowLeft, Zap, Flame, Thermometer, Fan, Gauge, Timer, Trophy, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const metadata = buildRouteMetadata({
  title: 'Mining Leaderboard — DevSnack',
  description: 'Bitaxe Gamma 601의 해시레이트·온도·전력·난이도 측정 기록',
  canonicalPath: '/misc/mining-leaderboard',
})

interface MiningScore {
  id: number
  measured_at: string
  hashrate_1m_ghs: number | null
  hashrate_10m_ghs: number | null
  hashrate_1h_ghs: number | null
  chip_temp: number | null
  vr_temp: number | null
  fan_speed: number | null
  power_w: number | null
  error_pct: number | null
  shares_accepted: number | null
  shares_rejected: number | null
  best_diff: number | null
  best_session_diff: number | null
  uptime_sec: number | null
  score: number | null
  rank_at_insert: number | null
  pool_hashrate_1m_ghs: number | null
  pool_hashrate_1h_ghs: number | null
  lastshare_sec: number | null
  pool_workers: number | null
  pool_bestshare: number | null
  pool_bestever: number | null
}

interface ScoreboardEntry {
  id: number
  measured_at: string
  rank: number
  difficulty: number | null
  job_id: string | null
}

const fmt = (n: number | null, digits = 1) => (n === null || n === undefined ? '-' : n.toLocaleString('ko-KR', { maximumFractionDigits: digits }))

function fmtTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default async function MiningLeaderboardPage() {
  const { data } = await supabase
    .from('mining_scores')
    .select('*')
    .order('score', { ascending: false })

  const rows = (data ?? []) as MiningScore[]
  const latest = rows[0] ?? null
  const top20 = rows.slice(0, 20)

  // 최신 측정 (풀 상태·스코어보드용 — id desc, 스코어와 무관)
  const { data: latestRow } = await supabase
    .from('mining_scores')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
  const latestMeasure = (latestRow?.[0] ?? null) as MiningScore | null

  // 최신 스코어보드 스냅샷 (가장 최근 measured_at 기준 — 베스트 공유 top 20)
  let scoreboard: ScoreboardEntry[] = []
  const { data: sbLatest } = await supabase
    .from('mining_scoreboard')
    .select('measured_at')
    .order('measured_at', { ascending: false })
    .limit(1)
  const sbTime = sbLatest?.[0]?.measured_at as string | undefined
  if (sbTime) {
    const { data: sb } = await supabase
      .from('mining_scoreboard')
      .select('id, measured_at, rank, difficulty, job_id')
      .eq('measured_at', sbTime)
      .order('rank', { ascending: true })
    scoreboard = (sb ?? []) as ScoreboardEntry[]
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/misc" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Junk Drawer 목록으로
        </Link>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⛏️</span>
          <h1 className="text-2xl md:text-3xl font-bold">채굴 스코어 리더보드</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Bitaxe Gamma 601 — BTC 솔로 채굴 성적표. 매 6시간 자동 갱신 (00 · 06 · 12 · 18시) · 재미용 ⚡
        </p>

        {!latest ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            아직 기록이 없어요. 첫 측정이 들어오면 여기에 표시됩니다!
          </div>
        ) : (
          <>
            {/* 최신 상태 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/5 border border-amber-500/30 p-4 col-span-2 md:col-span-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-1">
                  <Trophy className="w-3.5 h-3.5" /> 현재 스코어
                </div>
                <div className="text-3xl font-extrabold">{fmt(latest.score, 0)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {latest.rank_at_insert ? `${latest.rank_at_insert}위` : '-'} · {fmtTime(latest.measured_at)} 갱신
                </div>
              </div>

              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-1">
                  <Gauge className="w-3.5 h-3.5" /> 해시레이트
                </div>
                <div className="text-2xl font-bold">{((latest.hashrate_1m_ghs ?? 0) / 1e3).toFixed(2)}<span className="text-sm font-normal text-muted-foreground"> TH/s</span></div>
                <div className="text-xs text-muted-foreground mt-1">1m · 10m · 1h 기준</div>
              </div>

              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mb-1">
                  <Zap className="w-3.5 h-3.5" /> 역대 bestDiff
                </div>
                <div className="text-2xl font-bold">{((latest.best_diff ?? 0) / 1e9).toFixed(2)}<span className="text-sm font-normal text-muted-foreground"> B</span></div>
                <div className="text-xs text-muted-foreground mt-1">블록 난이도 대비 운 지표</div>
              </div>

              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-1">
                  <Thermometer className="w-3.5 h-3.5" /> 온도
                </div>
                <div className="text-2xl font-bold">{fmt(latest.chip_temp)}<span className="text-sm font-normal text-muted-foreground">°C</span></div>
                <div className="text-xs text-muted-foreground mt-1">VR {fmt(latest.vr_temp)}°C · 팬 {fmt(latest.fan_speed, 0)}% · {fmt(latest.power_w, 1)}W</div>
              </div>
            </div>

            {/* 베스트 공유 스코어보드 (채굴기 UI 동일) */}
            <div className="rounded-xl border bg-card overflow-hidden mb-8">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
                <h2 className="font-semibold text-sm md:text-base">⛏️ 베스트 공유 스코어보드</h2>
                <span className="text-xs text-muted-foreground">채굴기가 찾은 최고 난이도 공유 · {scoreboard.length > 0 ? `${scoreboard.length}위까지` : '-'} · {fmtTime(sbTime ?? null)} 스냅샷</span>
              </div>
              {scoreboard.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">스코어보드 데이터가 아직 없어요. 다음 갱신에 채워집니다!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="px-4 py-2 font-medium">순위</th>
                        <th className="px-4 py-2 font-medium text-right">공유 난이도</th>
                        <th className="px-4 py-2 font-medium text-right">블록 대비</th>
                        <th className="px-4 py-2 font-medium text-right">job</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreboard.map((e) => {
                        const diffB = e.difficulty ? (e.difficulty / 1e9).toFixed(3) : '-'
                        const vsBlock = e.difficulty ? `1/${Math.round((latestMeasure?.pool_bestever ?? 7.86e9) / e.difficulty).toLocaleString('ko-KR')}` : '-'
                        return (
                          <tr key={e.id} className={`border-b last:border-0 ${e.rank === 1 ? 'bg-amber-500/5' : e.rank === 2 ? 'bg-gray-500/5' : e.rank === 3 ? 'bg-orange-500/5' : ''}`}>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                e.rank === 1 ? 'bg-amber-400 text-amber-950'
                                : e.rank === 2 ? 'bg-gray-300 text-gray-800'
                                : e.rank === 3 ? 'bg-orange-300 text-orange-950'
                                : 'bg-muted text-muted-foreground'
                              }`}>{e.rank}</span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-semibold">{diffB} B</td>
                            <td className="px-4 py-2 text-right text-muted-foreground">{vsBlock}</td>
                            <td className="px-4 py-2 text-right text-muted-foreground font-mono text-xs">{e.job_id?.slice(0, 14) ?? '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 데일리 측정 기록 top 20 */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
                <h2 className="font-semibold text-sm md:text-base">📊 데일리 측정 기록 — 베스트 20</h2>
                <span className="text-xs text-muted-foreground">등락 = 직전 갱신 대비 랭크 변화</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="px-4 py-2 font-medium">랭크</th>
                      <th className="px-4 py-2 font-medium">갱신 시각</th>
                      <th className="px-4 py-2 font-medium text-right">스코어</th>
                      <th className="px-4 py-2 font-medium text-right">해시(1m)</th>
                      <th className="px-4 py-2 font-medium text-right">bestDiff</th>
                      <th className="px-4 py-2 font-medium text-right">칩 온도</th>
                      <th className="px-4 py-2 font-medium text-center">등락</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top20.map((r, i) => {
                      const rank = i + 1
                      const diff = r.rank_at_insert !== null ? r.rank_at_insert - rank : null
                      return (
                        <tr key={r.id} className={`border-b last:border-0 ${rank === 1 ? 'bg-amber-500/5' : ''}`}>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              rank === 1 ? 'bg-amber-400 text-amber-950'
                              : rank === 2 ? 'bg-gray-300 text-gray-800'
                              : rank === 3 ? 'bg-orange-300 text-orange-950'
                              : 'bg-muted text-muted-foreground'
                            }`}>{rank}</span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{fmtTime(r.measured_at)}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{fmt(r.score, 0)}</td>
                          <td className="px-4 py-2.5 text-right">{((r.hashrate_1m_ghs ?? 0) / 1e3).toFixed(2)} T</td>
                          <td className="px-4 py-2.5 text-right">{((r.best_diff ?? 0) / 1e9).toFixed(2)} B</td>
                          <td className="px-4 py-2.5 text-right">{fmt(r.chip_temp)}°C</td>
                          <td className="px-4 py-2.5 text-center">
                            {diff === null ? (
                              <span className="text-muted-foreground">-</span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 font-medium">
                                <TrendingUp className="w-3.5 h-3.5" />{diff}
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400 font-medium">
                                <TrendingDown className="w-3.5 h-3.5" />{-diff}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                                <Minus className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 푸터 정보 */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> 다음 갱신: 00 · 06 · 12 · 18시 (KST)</span>
              <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> 총 {rows.length}회 측정</span>
              <span className="flex items-center gap-1.5"><Fan className="w-3.5 h-3.5" /> 업타임 {(latest.uptime_sec ?? 0) / 3600 > 24 ? `${((latest.uptime_sec ?? 0) / 3600 / 24).toFixed(1)}일` : `${Math.round((latest.uptime_sec ?? 0) / 3600)}시간`}</span>
              <span className="flex items-center gap-1.5">⛏️ BTC 솔로 채굴 — 기대 블록 확률은 약 1/16,000 · 재미용</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
