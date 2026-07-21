'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
  /** content가 이미 HTML이면 raw HTML로 렌더링 */
  isHtml?: boolean
}

export function MarkdownRenderer({ content, isHtml = false }: Props) {
  // HTML 태그 포함 여부로 자동 감지
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content)
  
  if (hasHtmlTags || isHtml) {
    return (
      <div
        className="prose prose-devsnack dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div className="prose prose-devsnack dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
