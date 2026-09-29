// 공개 쇼케이스 데이터가 외부 미디어와 검증 기록을 잃지 않았는지 확인한다.
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { MZ_GROWTH_PAIN, MZ_GROWTH_PAIN_AUDIO_ID, MZ_GROWTH_PAIN_YOUTUBE_ID } from './mz-growth-pain.ts'

if (MZ_GROWTH_PAIN_AUDIO_ID !== '1CUWhiKdlMukbzKmkTrNL55xD2bb5Hjf7') throw new Error('Drive audio ID changed')
if (MZ_GROWTH_PAIN_YOUTUBE_ID !== '8be9oUjoFy0') throw new Error('YouTube video ID changed')
if (!MZ_GROWTH_PAIN.audioHref.includes(`/api/drive?id=${MZ_GROWTH_PAIN_AUDIO_ID}`)) throw new Error('audio must use the Drive proxy')
if (MZ_GROWTH_PAIN.production.actualTempo !== '90 BPM') throw new Error('actual score tempo must remain documented')
if (MZ_GROWTH_PAIN.production.actualKey !== 'B♭ major') throw new Error('actual score key must remain documented')
if (MZ_GROWTH_PAIN.production.status !== 'complete') throw new Error('generation status must remain complete')
if (MZ_GROWTH_PAIN.production.truncation !== 'ABC·semantic 모두 없음') throw new Error('truncation result must remain documented')
if (MZ_GROWTH_PAIN.lyrics.length !== 10) throw new Error('all ten lyric sections must remain present')
if (!MZ_GROWTH_PAIN.lyrics.some(section => section.title === 'Final Chorus')) throw new Error('final chorus is missing')
if (!MZ_GROWTH_PAIN.lyrics.flatMap(section => section.lines).includes('꿈은 대체 안 돼, 내 시간은 지워지지 않아')) throw new Error('canonical chorus line is missing')

console.log('MZ Growth Pain showcase data tests passed')
