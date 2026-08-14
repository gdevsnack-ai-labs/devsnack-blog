'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

/**
 * 현재 페이지 URL을 클립보드에 복사하는 버튼
 * - variant="inline": 메타 정보 줄용 (아이콘 + "링크" 텍스트)
 * - variant="fab": 전역 플로팅 버튼용 (원형 아이콘, 레이아웃 공통 배치)
 */
export function CopyLinkButton({ variant = 'inline' }: { variant?: 'inline' | 'fab' }) {
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

  if (variant === 'fab') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? '복사됨!' : '링크 복사'}
        aria-label="링크 복사"
        className={`fixed right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer bottom-20 md:bottom-6 ${
          copied
            ? 'bg-green-500 text-white scale-105'
            : 'bg-foreground text-background hover:scale-105'
        }`}
      >
        {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
      </button>
    )
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
