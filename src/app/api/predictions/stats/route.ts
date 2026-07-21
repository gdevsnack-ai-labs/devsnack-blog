import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const revalidate = 300 // 5분 ISR

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

  // 계산
  const r7 = recent7 || []
  const allData = allMorning || []

  const calcStats = (items: any[]) => {
    const total = items.length
    const correct = items.filter(p => p.is_correct === true).length
    const wrong = items.filter(p => p.is_correct === false).length
    const pending = items.filter(p => p.is_correct === null).length
    const accuracy = total > 0 && total !== pending
      ? Math.round((correct / (total - pending)) * 100) / 100
      : null
    return { total, correct, wrong, pending, accuracy }
  }

  const todayPrediction = latest && latest.session === 'morning' ? latest : null

  return NextResponse.json({
    today: todayPrediction ? {
      date: todayPrediction.date,
      direction: todayPrediction.direction,
      kospi_target: todayPrediction.kospi_target,
      prediction_raw: todayPrediction.prediction_raw,
      actual_kospi_close: todayPrediction.actual_kospi_close,
      actual_direction: todayPrediction.actual_direction,
      accuracy_score: todayPrediction.accuracy_score,
      is_correct: todayPrediction.is_correct,
      fail_reason: todayPrediction.fail_reason,
      improvement: todayPrediction.improvement,
    } : null,
    recent7: calcStats(r7),
    all: calcStats(allData),
    latestEvaluation: latest && latest.is_correct != null ? {
      is_correct: latest.is_correct,
      accuracy_score: latest.accuracy_score,
      fail_reason: latest.fail_reason,
      improvement: latest.improvement,
      date: latest.date,
    } : null,
  })
}
