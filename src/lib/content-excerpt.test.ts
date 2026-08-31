// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { toPlainTextExcerpt } from './content-excerpt.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

expectEqual(
  toPlainTextExcerpt(' <blockquote>요약</blockquote> <h2>결론</h2> <p>GB10 실측</p> '),
  '요약 결론 GB10 실측',
  'HTML tags must not cross the projection boundary',
)
expectEqual(
  toPlainTextExcerpt('&lt;blockquote&gt;요약&lt;/blockquote&gt; &amp; 결론'),
  '요약 & 결론',
  'encoded HTML tags must also become plain text',
)
expectEqual(
  toPlainTextExcerpt('첫 문장\n\n  둘째   문장'),
  '첫 문장 둘째 문장',
  'card excerpts must normalize whitespace',
)
expectEqual(
  toPlainTextExcerpt('', '요약이 아직 정리되지 않은 Knowledge 항목입니다.'),
  '요약이 아직 정리되지 않은 Knowledge 항목입니다.',
  'empty excerpts must use the safe fallback',
)

console.log('content excerpt tests passed')
