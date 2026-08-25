import { supabase } from '@/lib/supabase'

function percent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`
}

function direction(value: string | null): string {
  return value === '상승' ? 'Up' : value === '하락' ? 'Down' : value || 'Not recorded'
}

export async function EnglishStockPulseEvaluation() {
  const [{ data: latest }, { data: all }] = await Promise.all([
    supabase.from('predictions').select('date,direction,actual_direction,accuracy_score,is_correct').eq('session', 'morning').order('date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('predictions').select('accuracy_score,is_correct').eq('session', 'morning').not('accuracy_score', 'is', null),
  ])
  const rows = all || []
  const evaluated = rows.filter(row => row.is_correct !== null)
  const correct = evaluated.filter(row => row.is_correct === true).length
  const accuracy = evaluated.length ? correct / evaluated.length : null

  return (
    <section className="rounded-xl border border-green-200 bg-green-50/50 p-5 dark:border-green-900/50 dark:bg-green-950/15" aria-labelledby="english-evaluation-heading">
      <h2 id="english-evaluation-heading" className="text-xl font-bold">Prediction and evaluation</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Read-time evaluation from the existing <code>predictions</code> table. Accuracy is not copied into translated post content.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200/80 bg-white/80 p-3 dark:border-green-900/50 dark:bg-gray-900/50"><p className="text-xs text-muted-foreground">Latest forecast</p><p className="mt-2 text-lg font-bold">{direction(latest?.direction || null)}</p><p className="mt-1 text-xs text-muted-foreground">{latest?.date || 'Date not recorded'}</p></div>
        <div className="rounded-lg border border-green-200/80 bg-white/80 p-3 dark:border-green-900/50 dark:bg-gray-900/50"><p className="text-xs text-muted-foreground">Latest score</p><p className="mt-2 text-lg font-bold">{percent(latest?.accuracy_score ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">Actual: {direction(latest?.actual_direction || null)}</p></div>
        <div className="rounded-lg border border-green-200/80 bg-white/80 p-3 dark:border-green-900/50 dark:bg-gray-900/50"><p className="text-xs text-muted-foreground">All evaluated runs</p><p className="mt-2 text-lg font-bold">{percent(accuracy)}</p><p className="mt-1 text-xs text-muted-foreground">{correct}/{evaluated.length} correct</p></div>
      </div>
    </section>
  )
}
