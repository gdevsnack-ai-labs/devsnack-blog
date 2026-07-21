'use client'

import { useEffect } from 'react'
import { Eye } from 'lucide-react'

export function ViewCounter({ slug, views }: { slug: string; views: number }) {
  useEffect(() => {
    // Increment view count on page load (once)
    fetch(`/api/views/${slug}`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Eye className="w-4 h-4" />
      {views.toLocaleString()}
    </span>
  )
}
