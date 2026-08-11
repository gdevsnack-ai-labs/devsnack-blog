import { promises as fs } from 'fs'
import path from 'path'
import Image from 'next/image'
import { Play, Video, Eye, Clock } from 'lucide-react'

interface Video {
  videoId: string
  title: string
  description: string
  thumbnail: string
  url: string
  publishedAt: string
  channelTitle: string
  viewCount: string
  viewCountText: string
  duration: string
}

interface VideoData {
  videos: Video[]
  syncedAt: string
  source: string
  channelId: string
  channelUrl: string
}

const CHANNEL_URL = 'https://www.youtube.com/@DevsnackAILab'

async function getVideos(): Promise<Video[] | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'youtube-latest.json')
    const raw = await fs.readFile(file, 'utf-8')
    const data = JSON.parse(raw) as VideoData
    return Array.isArray(data.videos) && data.videos.length > 0 ? data.videos : null
  } catch {
    return null
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days < 1) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    if (days < 365) return `${Math.floor(days / 30)}개월 전`
    return `${Math.floor(days / 365)}년 전`
  } catch {
    return ''
  }
}

export async function LatestVideoCard() {
  const videos = await getVideos()

  // 데이터 없으면 채널 링크 placeholder
  if (!videos) {
    return (
      <a
        href={CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-dashed border-border rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/30 transition-colors no-underline"
      >
        <div className="aspect-video bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-950/30 dark:to-pink-950/30 rounded-lg mb-4 flex items-center justify-center">
          <Video className="w-12 h-12 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">DevSnack AI Lab YouTube</p>
        <p className="text-xs text-muted-foreground/70">채널 바로가기 →</p>
      </a>
    )
  }

  const [latest, ...rest] = videos

  return (
    <div className="space-y-3">
      {/* 최신 영상 — 대형 카드 */}
      <a
        href={latest.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900 hover:shadow-lg transition-all no-underline"
      >
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <Image
            src={latest.thumbnail}
            alt={latest.title}
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized={!latest.thumbnail.startsWith('https://')}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-7 h-7 text-white fill-white ml-0.5" />
            </div>
          </div>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium flex items-center gap-1">
            <Video className="w-3 h-3" />
            YouTube
          </div>
          {latest.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-medium tabular-nums">
              {latest.duration}
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold leading-snug line-clamp-2 mb-2 text-foreground">
            {latest.title}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {latest.viewCountText || '0'}회
            </span>
            <span>{relativeTime(latest.publishedAt) || formatDate(latest.publishedAt)}</span>
          </div>
        </div>
      </a>

      {/* 최근 영상 — 리스트 */}
      {rest.length > 0 && (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
          {rest.map((v) => (
            <a
              key={v.videoId}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors no-underline group"
            >
              <div className="relative w-24 h-14 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={v.thumbnail}
                  alt={v.title}
                  fill
                  sizes="96px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized={!v.thumbnail.startsWith('https://')}
                />
                {v.duration && (
                  <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-white text-[10px] font-medium tabular-nums">
                    {v.duration}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-snug line-clamp-2 text-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {v.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {v.viewCountText || '0'}회
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {relativeTime(v.publishedAt) || formatDate(v.publishedAt)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
