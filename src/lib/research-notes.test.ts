// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { RESEARCH_NOTES } from '../data/research-notes.ts'

const categories = new Set(['models', 'tools', 'agents', 'media', 'infra', 'misc'])
const statuses = new Set(['research-complete', 'experiment-candidate', 'awaiting-test', 'archived'])

if (RESEARCH_NOTES.length !== 24) {
  throw new Error(`Research Board snapshot must contain 24 notes, got ${RESEARCH_NOTES.length}`)
}
if (!RESEARCH_NOTES.every(note => categories.has(note.category))) {
  throw new Error('Research Board contains an unknown category')
}
if (!RESEARCH_NOTES.every(note => statuses.has(note.status))) {
  throw new Error('Research Board contains an unknown status')
}
if (!RESEARCH_NOTES.every(note => note.external_url.startsWith('https://gdevsnack-ai-labs.github.io/devsnack-research-notes/notes/'))) {
  throw new Error('Research Board external_url must point to GitHub Pages Notes')
}
if (!RESEARCH_NOTES.every(note => note.promoted_asset_url === null)) {
  throw new Error('Research Board promotion links must remain null before promotion')
}
if (!RESEARCH_NOTES.every(note => /^\d{4}-\d{2}-\d{2}$/.test(note.researched_date) && /^\d{4}-\d{2}-\d{2}$/.test(note.published_date))) {
  throw new Error('Research Board dates must use YYYY-MM-DD')
}
if (new Set(RESEARCH_NOTES.map(note => note.original_devsnack_url)).size !== 24) {
  throw new Error('Each Research Board note must preserve its original DevSnack URL')
}

console.log(`research board snapshot tests passed: ${RESEARCH_NOTES.length}`)
