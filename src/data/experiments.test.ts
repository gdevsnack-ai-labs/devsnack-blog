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

const stockpulse = experiments.find(experiment => experiment.id === 'stockpulse-ai-self-improvement')
if (!stockpulse) throw new Error('StockPulse v1 experiment is missing')
if (stockpulse.status !== '완료') throw new Error(`StockPulse v1 must be completed, got ${stockpulse.status}`)
if (stockpulse.progress !== 100) throw new Error(`StockPulse v1 must be 100%, got ${stockpulse.progress}`)
if (stockpulse.category !== 'completed') throw new Error(`StockPulse v1 category must be completed, got ${stockpulse.category}`)
for (const marker of ['v1', '68개', '54개', 'GitHub Pages', 'v2']) {
  if (!`${stockpulse.description} ${stockpulse.whyText || ''} ${(stockpulse.nextGoals || []).join(' ')}`.includes(marker)) {
    throw new Error(`StockPulse v1 copy is missing marker: ${marker}`)
  }
}
if ((stockpulse.blogPosts || []).length !== 0) throw new Error('StockPulse v1 must not expose daily Lab post links')
if (!(stockpulse.externalLinks || []).some(link => link.href.includes('stockpulse-publication'))) throw new Error('StockPulse v1 must link to external publication')
const stockpulseFinding = getKeyFinding(stockpulse) || ''
for (const marker of ['v1', '68개', '54개', 'GitHub Pages']) {
  if (!stockpulseFinding.includes(marker)) throw new Error(`StockPulse finding is missing marker: ${marker}`)
}

console.log('AI Tech and StockPulse v1 completion tests passed')
