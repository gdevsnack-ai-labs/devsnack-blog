import { experiments } from './experiments'
import { getKeyFinding } from '../lib/labs'

const blog = experiments.find(experiment => experiment.id === 'blog')
if (!blog) throw new Error('Blog Automation experiment is missing')
if (blog.status !== '완료') throw new Error(`AI Tech v1 Lab must be completed, got ${blog.status}`)
if (blog.progress !== 100) throw new Error(`AI Tech v1 Lab must be 100%, got ${blog.progress}`)
if (blog.category !== 'completed') throw new Error(`AI Tech v1 Lab category must be completed, got ${blog.category}`)

for (const marker of ['매일', '사실과 다른', 'v2', 'GitHub Pages', 'DevSnack Lab', '단순 피드 전용 slug']) {
  if (!`${blog.description} ${blog.whyText || ''} ${(blog.nextGoals || []).join(' ')}`.includes(marker)) {
    throw new Error(`AI Tech v1 Lab copy is missing marker: ${marker}`)
  }
}

if ((blog.blogPosts || []).length !== 0) throw new Error('AI Tech v1 Lab must not expose daily feed post links')

const keyFinding = getKeyFinding(blog) || ''
for (const marker of ['v1', 'v2', 'GitHub Pages']) {
  if (!keyFinding.includes(marker)) throw new Error(`AI Tech Lab finding is missing marker: ${marker}`)
}

console.log('AI Tech v1 Lab completion tests passed')
