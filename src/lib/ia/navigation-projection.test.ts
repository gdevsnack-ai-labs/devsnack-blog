import {
  MOBILE_NAV_GROUPS,
  NAV_GROUPS,
  NAV_GROUP_REGISTRY,
  activeHrefMatches,
  type NavGroup,
  type NavItem,
} from './navigation-projection'
import { postHref } from '../../config/site-catalog'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message)
}

const existingRoutes = new Set([
  '/', '/devsnack', '/labs', '/demos', '/research',
  '/research/category/llm', '/research/category/tts', '/research/category/media',
  '/research/category/benchmark', '/research/category/hardware',
  '/aitech', '/stock', '/misc/mining-leaderboard', '/benchmarks', '/data',
  '/search', '/about', '/links', '/rss.xml', '/contact', '/privacy',
  '/misc', '/tools/operations',
])

const allEnabledItems: NavItem[] = NAV_GROUPS.flatMap((group: NavGroup) => group.items.filter(item => item.enabled !== false))
for (const item of allEnabledItems) {
  expectTrue(existingRoutes.has(item.href), `enabled navigation item points to a missing route: ${item.id} → ${item.href}`)
}

expectEqual(NAV_GROUPS.map(group => group.id).join(','), 'stories,lab,benchmarks,knowledge,data,more', 'desktop must activate the available Benchmarks hub')
expectEqual(MOBILE_NAV_GROUPS.map(group => group.id).join(','), 'stories,lab,knowledge,data,more', 'mobile must use the safe six-tab projection')
expectTrue(NAV_GROUP_REGISTRY.find(group => group.id === 'benchmarks')?.enabled !== false, 'Benchmarks must be enabled after its Hub exists')
expectTrue(allEnabledItems.some(item => item.href === '/benchmarks'), 'Benchmarks Hub must be exposed after Phase 3')
expectTrue(NAV_GROUPS.some(group => group.id === 'lab' && group.items.some(item => item.href === '/labs')), 'Lab hub must use /labs')
expectTrue(NAV_GROUPS.some(group => group.id === 'lab' && group.items.some(item => item.activeHrefs?.includes('/lab'))), 'legacy /lab must keep Lab active state')
expectTrue(activeHrefMatches('/lab/legacy-post', { href: '/labs', activeHrefs: ['/lab'] }), 'legacy Lab content path must highlight the Lab group')
expectTrue(NAV_GROUPS.some(group => group.id === 'knowledge' && group.items.some(item => item.href === '/research')), 'Knowledge must project to the existing Research hub')
expectTrue(NAV_GROUPS.some(group => group.id === 'data' && group.items.some(item => item.href === '/aitech')), 'Data must expose AI Tech')
expectTrue(NAV_GROUPS.some(group => group.id === 'data' && group.items.some(item => item.href === '/data')), 'Data must expose its new Hub')
expectTrue(MOBILE_NAV_GROUPS.some(group => group.id === 'more' && group.items.some(item => item.href === '/benchmarks')), 'Mobile More must expose Benchmarks when the tab is omitted')
expectTrue(NAV_GROUPS.some(group => group.id === 'data' && group.items.some(item => item.href === '/stock')), 'Data must expose StockPulse')
expectTrue(NAV_GROUPS.some(group => group.id === 'more' && group.items.some(item => item.href === '/tools/operations')), 'Operations must remain discoverable')
expectEqual(postHref('lab', 'legacy-post'), '/lab/legacy-post', 'Lab content URLs must remain on /lab/[slug]')
expectEqual(postHref('research', 'knowledge-post'), '/research/knowledge-post', 'Knowledge content URLs must remain on /research/[id]')

console.log(`navigation projection tests passed: desktopGroups=${NAV_GROUPS.length}, mobileGroups=${MOBILE_NAV_GROUPS.length}, enabledItems=${allEnabledItems.length}`)
