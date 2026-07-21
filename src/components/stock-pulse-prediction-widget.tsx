import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, HelpCircle, BarChart3, Target } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

function DirectionIcon({ direction, size = 16 }: { direction: string; size?: number }) {
  if (direction === '상승') return <TrendingUp size={size} className="text-red-500" />
  if (direction === '하락') return <TrendingDown size={size} className="text-blue-500" />
  return <Minus size={size} className="text-gray-400" />
}

function AccuracyBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-400">-</span>
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-500'
  return <span className={`text-sm font-bold ${color}`}>{pct}%</span>
}

function StatusBadge({ is_correct }: { is_correct: boolean | null }) {
  if (is_correct === true) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="w-3 h-3" /> 성공
      </span>
    )
  }
  if (is_correct === false) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <AlertCircle className="w-3 h-3" /> 실패
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <HelpCircle className="w-3 h-3" /> 평가 전
    </span>
  )
}

export async function StockPulsePredictionWidget() {
  // 1. 가장 최근 예측
  const { data: latest } = await supabase
    .from('predictions')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 2. 최근 7일
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDayStr = sevenDaysAgo.toISOString().slice(0, 10)

  const { data: recent7 } = await supabase
    .from('predictions')
    .select('*')
    .gte('date', sevenDayStr)
    .order('date', { ascending: false })

  // 3. 전체 통계
  const { data: allMorning } = await supabase
    .from('predictions')
    .select('accuracy_score, is_correct')
    .not('accuracy_score', 'is', null)

  // 아무 데이터도 없으면 렌더링 안 함
  if ((!recent7 || recent7.length === 0) && (!latest || !latest.is_correct)) {
    return null
  }

  // 계산
  const r7 = recent7 || []
  const r7Total = r7.length
  const r7Correct = r7.filter(p => p.is_correct === true).length
  const r7Wrong = r7.filter(p => p.is_correct === false).length
  const r7Pending = r7.filter(p => p.is_correct === null).length
  const r7Accuracy = r7Total > 0 && r7Total !== r7Pending
    ? Math.round((r7Correct / (r7Total - r7Pending)) * 100) / 100
    : null

  const all = allMorning || []
  const allTotal = all.length
  const allCorrect = all.filter(p => p.is_correct === true).length
  const allWrong = all.filter(p => p.is_correct === false).length
  const allPending = all.filter(p => p.is_correct === null).length
  const allAccuracy = allTotal > 0 && allTotal !== allPending
    ? Math.round((allCorrect / (allTotal - allPending)) * 100) / 100
    : null

  // 오늘 예측 = 최신 morning 세션
  const todayPrediction = latest?.session === 'morning' ? latest : null

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        AI 자기개선 실험 — 예측 정확도
      </h3>

      <div className="grid gap-3 md:grid-cols-3">
        {/* 오늘 예측 */}
        <div className="border border-border rounded-xl p-4 bg-white dark:bg-gray-900">
          {todayPrediction ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">오늘 예측 ({todayPrediction.date})</span>
                <StatusBadge is_correct={todayPrediction.is_correct} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <DirectionIcon direction={todayPrediction.direction} size={20} />
                <span className="text-lg font-bold">{todayPrediction.direction}</span>
                {todayPrediction.kospi_target && (
                  <span className="text-sm text-muted-foreground">
                    <Target className="w-3 h-3 inline mr-1" />
                    {todayPrediction.kospi_target}
                  </span>
                )}
              </div>
              {todayPrediction.prediction_raw && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{todayPrediction.prediction_raw}</p>
              )}
              {todayPrediction.actual_kospi_close && (
                <p className="text-xs text-muted-foreground mt-2">
                  실제 종가: <span className="font-medium">{todayPrediction.actual_kospi_close?.toLocaleString()}</span>
                  {todayPrediction.actual_direction && (
                    <> · 실제 방향: <span className="font-medium">{todayPrediction.actual_direction}</span></>
                  )}
                </p>
              )}
              {todayPrediction.is_correct !== null && (
                <p className="text-xs mt-2 flex items-center gap-1">
                  정확도: <AccuracyBadge score={todayPrediction.accuracy_score} />
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground">오늘 예측 없음</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">장 시작 전에 예측이 저장됩니다</p>
            </div>
          )}
        </div>

        {/* 최근 7일 통계 */}
        <div className="border border-border rounded-xl p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">최근 7일</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <AccuracyBadge score={r7Accuracy} />
            <span className="text-xs text-muted-foreground">정확도</span>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="text-green-600 dark:text-green-400">✅ {r7Correct}</span>
            <span className="text-red-500">❌ {r7Wrong}</span>
            {r7Pending > 0 && <span className="text-gray-400">⏳ {r7Pending}</span>}
          </div>
          {r7Total > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: r7Accuracy !== null ? `${Math.round(r7Accuracy * 100)}%` : '0%',
                  background: r7Accuracy !== null
                    ? r7Accuracy >= 0.7 ? '#16a34a' : r7Accuracy >= 0.4 ? '#ca8a04' : '#dc2626'
                    : '#d1d5db',
                }}
              />
            </div>
          )}
          {r7Total === 0 && (
            <p className="text-xs text-muted-foreground mt-1">데이터 수집 중...</p>
          )}
        </div>

        {/* 전체 통계 */}
        <div className="border border-border rounded-xl p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">전체</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <AccuracyBadge score={allAccuracy} />
            <span className="text-xs text-muted-foreground">정확도 (총 {allTotal}회)</span>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="text-green-600 dark:text-green-400">✅ {allCorrect}</span>
            <span className="text-red-500">❌ {allWrong}</span>
            {allPending > 0 && <span className="text-gray-400">⏳ {allPending}</span>}
          </div>
          {latest && latest.is_correct !== null && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground">
                최근 평가 ({latest.date}): <StatusBadge is_correct={latest.is_correct} />
              </p>
              {latest.accuracy_score !== null && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  정확도 {Math.round(latest.accuracy_score * 100)}%
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
