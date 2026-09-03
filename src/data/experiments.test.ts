import { experiments } from './experiments'
import { getProjectFinding, validateProjectFinding } from '../lib/labs'

const autonomous = experiments.find(experiment => experiment.id === 'autonomous-ai-blog')
if (!autonomous) throw new Error('Autonomous AI Blog experiment is missing')
if (getProjectFinding(autonomous)) throw new Error('Autonomous publication summary must not become a project finding')
if ((autonomous.externalLinks || []).some(link => link.label === 'Latest Note')) throw new Error('Autonomous publications must use the Recent Publications projection')

const blog = experiments.find(experiment => experiment.id === 'blog')
if (!blog) throw new Error('Blog Automation experiment is missing')
if (blog.status !== '완료') throw new Error(`AI Tech v1 Lab must be completed, got ${blog.status}`)
if (blog.progress !== 100) throw new Error(`AI Tech v1 Lab must be 100%, got ${blog.progress}`)
if (blog.category !== 'completed') throw new Error(`AI Tech v1 Lab category must be completed, got ${blog.category}`)

if (!blog.description.trim() || !blog.whyText?.trim() || !blog.nextGoals?.some(goal => goal.trim())) {
  throw new Error('AI Tech v1 project context must include description, purpose, and next goals')
}

if ((blog.blogPosts || []).length !== 0) throw new Error('AI Tech v1 Lab must not expose daily feed post links')

const projectFinding = getProjectFinding(blog)
const projectFindingErrors = validateProjectFinding(projectFinding)
if (projectFindingErrors.length > 0) throw new Error(`AI Tech Project Finding is invalid: ${projectFindingErrors.join(', ')}`)

const stockpulse = experiments.find(experiment => experiment.id === 'stockpulse-ai-self-improvement')
if (!stockpulse) throw new Error('StockPulse v1 experiment is missing')
if (stockpulse.status !== '완료') throw new Error(`StockPulse v1 must be completed, got ${stockpulse.status}`)
if (stockpulse.progress !== 100) throw new Error(`StockPulse v1 must be 100%, got ${stockpulse.progress}`)
if (stockpulse.category !== 'completed') throw new Error(`StockPulse v1 category must be completed, got ${stockpulse.category}`)
if (!stockpulse.description.trim() || !stockpulse.whyText?.trim() || !stockpulse.nextGoals?.some(goal => goal.trim())) {
  throw new Error('StockPulse v1 project context must include description, purpose, and next goals')
}
if ((stockpulse.blogPosts || []).length !== 0) throw new Error('StockPulse v1 must not expose daily Lab post links')
if (!(stockpulse.externalLinks || []).some(link => link.label.trim() && /^https?:\/\//.test(link.href))) throw new Error('StockPulse v1 must expose a labeled external publication link')
const stockpulseFinding = getProjectFinding(stockpulse)
const stockpulseFindingErrors = validateProjectFinding(stockpulseFinding)
if (stockpulseFindingErrors.length > 0) throw new Error(`StockPulse Project Finding is invalid: ${stockpulseFindingErrors.join(', ')}`)

const stockpulseFixed = experiments.find(experiment => experiment.id === 'stockpulse-v1-fixed')
if (!stockpulseFixed) throw new Error('StockPulse V1 Fixed experiment is missing')
if (stockpulseFixed.isDummy) throw new Error('StockPulse V1 Fixed must be a formal Lab project')
if (stockpulseFixed.status !== '진행중' || stockpulseFixed.category !== 'running') throw new Error('StockPulse V1 Fixed must be an active running project')
if (!stockpulseFixed.publicDiscovery) throw new Error('StockPulse V1 Fixed must participate in public discovery')

console.log('AI Tech, StockPulse v1, and StockPulse V1 Fixed tests passed')
