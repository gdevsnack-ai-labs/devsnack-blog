import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Music2 } from 'lucide-react'
import { MZ_GROWTH_PAIN, MZ_GROWTH_PAIN_AUDIO_ID, MZ_GROWTH_PAIN_YOUTUBE_ID } from '@/data/showcases/mz-growth-pain'
import { absoluteSiteUrl, buildRouteMetadata } from '@/lib/seo/metadata'

const CANONICAL_PATH = '/demos/music/mz-growth-pain'
const DESCRIPTION = 'YuE2-3B로 만든 MZ 성장통 2탄 〈꿈은 대체 안 돼〉의 음원, 가사, 제작 정보와 시행착오를 한 페이지에 누적하는 음악 쇼케이스입니다.'

export const metadata: Metadata = {
  ...buildRouteMetadata({
    title: 'MZ 성장통 — 꿈은 대체 안 돼 | DevSnack Music Showcase',
    description: DESCRIPTION,
    canonicalPath: CANONICAL_PATH,
    kind: 'article',
    language: 'ko',
    section: 'Music Showcase',
    image: MZ_GROWTH_PAIN.thumbnailHref,
    publishedTime: '2026-09-22',
    modifiedTime: '2026-09-29',
    keywords: ['MZ 성장통', '꿈은 대체 안 돼', 'YuE2-3B', 'AI 음악 생성', '한국어 힙합', '음악 제작 기록'],
  }),
  authors: [{ name: 'DevSnack' }],
}

export const revalidate = 3600

const productionRows = [
  ['모델', MZ_GROWTH_PAIN.production.model],
  ['생성 장비', MZ_GROWTH_PAIN.production.hardware],
  ['생성 모드', MZ_GROWTH_PAIN.production.generationMode],
  ['Seed', MZ_GROWTH_PAIN.production.seed],
  ['스타일 목표', `${MZ_GROWTH_PAIN.production.targetTempo} · ${MZ_GROWTH_PAIN.production.targetKey}`],
  ['실제 계획 악보', `${MZ_GROWTH_PAIN.production.actualTempo} · ${MZ_GROWTH_PAIN.production.actualKey}`],
  ['생성 결과', `${MZ_GROWTH_PAIN.production.status} · ${MZ_GROWTH_PAIN.production.truncation}`],
  ['길이', MZ_GROWTH_PAIN.production.duration],
  ['원본 / 전달본', `${MZ_GROWTH_PAIN.production.sourceAudio} / ${MZ_GROWTH_PAIN.production.deliveryAudio}`],
  ['생성 시간', MZ_GROWTH_PAIN.production.generationTime],
]

function ExternalLinkLabel({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 no-underline hover:underline dark:text-blue-400">
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  )
}

export default function MzGrowthPainShowcasePage() {
  const canonical = absoluteSiteUrl(CANONICAL_PATH)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: MZ_GROWTH_PAIN.title,
    alternateName: MZ_GROWTH_PAIN.titleEn,
    description: DESCRIPTION,
    url: canonical,
    inLanguage: 'ko-KR',
    duration: 'PT3M19.64S',
    datePublished: '2026-09-22',
    dateModified: '2026-09-29',
    genre: ['Korean hip-hop', 'Melodic boom-bap', 'Alternative R&B'],
    creator: { '@type': 'Person', name: '문규 강' },
    recordingOf: { '@type': 'MusicComposition', name: MZ_GROWTH_PAIN.title },
    audio: {
      '@type': 'AudioObject',
      contentUrl: absoluteSiteUrl(MZ_GROWTH_PAIN.audioHref),
      encodingFormat: 'audio/mpeg',
      name: `${MZ_GROWTH_PAIN.title} — 320kbps MP3`,
    },
    video: {
      '@type': 'VideoObject',
      name: `${MZ_GROWTH_PAIN.title} — Music Video`,
      embedUrl: MZ_GROWTH_PAIN.youtubeEmbedHref,
      contentUrl: MZ_GROWTH_PAIN.youtubeWatchHref,
      thumbnailUrl: MZ_GROWTH_PAIN.thumbnailHref,
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href={MZ_GROWTH_PAIN.links.musicShowcase} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Music Showcase로 돌아가기
        </Link>

        <article>
          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">🎵 {MZ_GROWTH_PAIN.series}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">업데이트 {MZ_GROWTH_PAIN.lastUpdated}</span>
            </div>
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
              <div>
                <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">{MZ_GROWTH_PAIN.title}</h1>
                <p className="mt-3 text-lg text-muted-foreground">{MZ_GROWTH_PAIN.titleEn}</p>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{MZ_GROWTH_PAIN.introduction}</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MZ_GROWTH_PAIN.thumbnailHref} alt={`${MZ_GROWTH_PAIN.title} 뮤직비디오 썸네일`} className="aspect-video w-full object-cover" loading="eager" />
              </div>
            </div>
          </header>

          <section className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-950/20" aria-labelledby="listen-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Listen</p>
                <h2 id="listen-heading" className="mt-1 text-xl font-bold">지금 바로 들어보기</h2>
                <p className="mt-1 text-sm text-muted-foreground">음원은 Google Drive, 뮤직비디오는 기존 YouTube 공개본으로 연결합니다.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <a href={MZ_GROWTH_PAIN.audioHref} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white no-underline hover:bg-blue-800">
                  <Music2 className="h-4 w-4" aria-hidden="true" />
                  MP3 듣기
                </a>
                <ExternalLinkLabel href={MZ_GROWTH_PAIN.youtubeWatchHref}>YouTube MV</ExternalLinkLabel>
              </div>
            </div>
            <audio controls preload="metadata" className="mt-5 w-full" aria-label={`${MZ_GROWTH_PAIN.title} 음원`}>
              <source src={MZ_GROWTH_PAIN.audioHref} type="audio/mpeg" />
              브라우저가 audio 태그를 지원하지 않습니다.
            </audio>
            <p className="mt-2 break-all text-xs text-muted-foreground">Google Drive 파일 ID: {MZ_GROWTH_PAIN_AUDIO_ID}</p>
          </section>

          <section className="mb-10" aria-labelledby="video-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Music Video</p>
                <h2 id="video-heading" className="mt-1 text-2xl font-bold">살아온 시간은 복제할 수 없으니까</h2>
              </div>
              <ExternalLinkLabel href={MZ_GROWTH_PAIN.youtubeWatchHref}>MelodyPie90S YouTube에서 보기</ExternalLinkLabel>
            </div>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-sm">
              <iframe
                src={MZ_GROWTH_PAIN.youtubeEmbedHref}
                title={`${MZ_GROWTH_PAIN.title} 뮤직비디오`}
                className="h-full w-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">YouTube video ID: {MZ_GROWTH_PAIN_YOUTUBE_ID} · 기존 공개본을 임베드합니다.</p>
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
            <div className="space-y-8">
              <section aria-labelledby="story-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Why this song</p>
                <h2 id="story-heading" className="mt-1 text-2xl font-bold">성장통을 성공담으로 덮지 않기</h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  이 곡은 집값, 자격증, 월세, 결혼 연기, 신입 채용의 경력 요구와 AI 대체 불안을 한꺼번에 들여다봅니다. 하지만 마지막에 갑자기 모든 문제가 해결되지는 않아요. 대신 실패한 만큼 남은 질문과, 오늘 다시 켤 수 있는 작은 불을 붙잡습니다.
                </p>
                <ul className="mt-5 space-y-3">
                  {MZ_GROWTH_PAIN.emotionalArc.map(item => (
                    <li key={item} className="flex gap-3 text-sm leading-6">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="lyrics-heading">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lyrics</p>
                  <h2 id="lyrics-heading" className="mt-1 text-2xl font-bold">가사</h2>
                  <p className="mt-2 text-sm text-muted-foreground">생성에 실제로 사용한 가사를 섹션별로 보존합니다.</p>
                </div>
                <div className="space-y-3">
                  {MZ_GROWTH_PAIN.lyrics.map((section, index) => (
                    <details key={section.title} open={index < 2} className="group rounded-xl border border-border bg-muted/10 p-4">
                      <summary className="cursor-pointer list-none font-semibold marker:hidden">
                        <span className="flex items-center justify-between gap-4">
                          {section.title}
                          <span className="text-lg text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                        </span>
                      </summary>
                      <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                        {section.lines.map((line, lineIndex) => (
                          <p key={`${section.title}-${lineIndex}`}>{line}</p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-border bg-muted/20 p-5" aria-labelledby="production-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Making of</p>
                <h2 id="production-heading" className="mt-1 text-xl font-bold">제작 정보</h2>
                <dl className="mt-4 divide-y divide-border text-sm">
                  {productionRows.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[92px_1fr] gap-3 py-3 first:pt-0 last:pb-0">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="break-words font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-2xl border border-border p-5" aria-labelledby="notes-heading">
                <h2 id="notes-heading" className="text-xl font-bold">기록할 때 함께 본 것</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {MZ_GROWTH_PAIN.notes.map(note => <li key={note}>· {note}</li>)}
                </ul>
                <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                  <ExternalLinkLabel href="https://huggingface.co/m-a-p/YuE2-3B">YuE2-3B 모델 카드</ExternalLinkLabel>
                  <ExternalLinkLabel href="https://huggingface.co/m-a-p/YuE2-Vae">YuE2-Vae 모델 카드</ExternalLinkLabel>
                  <ExternalLinkLabel href="https://raw.githubusercontent.com/multimodal-art-projection/YuE/main/MODEL_LICENSE">YuE 공식 라이선스 원문</ExternalLinkLabel>
                  <Link href={MZ_GROWTH_PAIN.links.research} className="block text-blue-600 no-underline hover:underline dark:text-blue-400">YuE2 악보 계획 연구 글 →</Link>
                </div>
              </section>
            </aside>
          </div>

          <section className="mt-10" aria-labelledby="timeline-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Process log</p>
            <h2 id="timeline-heading" className="mt-1 text-2xl font-bold">만든 과정</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {MZ_GROWTH_PAIN.timeline.map((item, index) => (
                <div key={item.label} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{index + 1}</span>
                    {item.label}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-2xl border border-dashed border-border p-5" aria-labelledby="updates-heading">
            <h2 id="updates-heading" className="text-xl font-bold">이 페이지는 계속 업데이트합니다</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              새 곡, 다른 seed 비교, 가사 수정, 뮤직비디오 버전, 직접 청취 후의 판단을 새 글로 흩어놓지 않고 이 페이지에 계속 덧붙입니다. 음원과 영상은 외부 링크를 유지하고, Vercel에는 공개 가능한 기록과 작은 메타데이터만 남깁니다.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
