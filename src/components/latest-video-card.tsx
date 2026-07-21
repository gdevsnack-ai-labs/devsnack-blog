import { promises as fs } from 'fs'
import path from 'path'
import { Play, Video } from 'lucide-react'

interface Video {
  videoId: string
  title: string
  description: string
  thumbnail: string
  url: string
  publishedAt: string
  channelTitle: string
  syncedAt: string
  source: string
  channelId: string
}

const CHANNEL_URL = 'https://www.youtube.com/@DevsnackAILab'

async function getLatestVideo(): Promise<Video | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'youtube-latest.json')
    const raw = await fs.readFile(file, 'utf-8')
    return JSON.parse(raw) as Video
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

export async function LatestVideoCard() {
  const video = await getLatestVideo()

  // 데이터 없으면 채널 링크 placeholder
  if (!video) {
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

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900 hover:shadow-lg transition-all no-underline"
    >
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold leading-snug line-clamp-2 mb-2 text-foreground">
          {video.title}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{video.channelTitle}</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </div>
    </a>
  )
}
