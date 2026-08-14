'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

/**
 * 현재 페이지 URL을 클립보드에 복사하는 버튼
 * 게시물 상세 페이지 메타 라인에 공통 사용
 */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // 클립보드 API 미지원 환경 fallback
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="링크 복사"
      aria-label="링크 복사"
      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400">복사됨!</span>
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4" />
          <span>링크</span>
        </>
      )}
    </button>
  )
}
