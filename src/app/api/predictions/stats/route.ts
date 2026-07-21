import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const revalidate = 300 // 5분 ISR

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. 가장 최근 예측 (오늘/최신)
  const { data: latest } = await supabase
    .from('predictions')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // 2. 최근 7일 예측 정확도 통계
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
  const recent7Total = recent7?.length || 0
  const recent7Correct = recent7?.filter(p => p.is_correct === true).length || 0
  const recent7Wrong = recent7?.filter(p => p.is_correct === false).length || 0
  const recent7Pending = recent7?.filter(p => p.is_correct === null).length || 0
  const recent7Accuracy = recent7Total > 0 && recent7Total !== recent7Pending
    ? Math.round((recent7Correct / (recent7Total - recent7Pending)) * 100) / 100
    : null

  const allTotal = allMorning?.length || 0
  const allCorrect = allMorning?.filter(p => p.is_correct === true).length || 0
  const allWrong = allMorning?.filter(p => p.is_correct === false).length || 0
  const allPending = allMorning?.filter(p => p.is_correct === null).length || 0
  const allAccuracy = allTotal > 0 && allTotal !== allPending
    ? Math.round((allCorrect / (allTotal - allPending)) * 100) / 100
    : null

  // 오늘 예측 (가장 최근 morning 세션)
  const todayPrediction = latest?.session === 'morning' ? latest : null

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
    recent7: {
      total: recent7Total,
      correct: recent7Correct,
      wrong: recent7Wrong,
      pending: recent7Pending,
      accuracy: recent7Accuracy,
    },
    all: {
      total: allTotal,
      correct: allCorrect,
      wrong: allWrong,
      pending: allPending,
      accuracy: allAccuracy,
    },
    latestEvaluation: latest?.is_correct !== null ? {
      is_correct: latest.is_correct,
      accuracy_score: latest.accuracy_score,
      fail_reason: latest.fail_reason,
      improvement: latest.improvement,
      date: latest.date,
    } : null,
  })
}
