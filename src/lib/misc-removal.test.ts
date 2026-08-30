import {
  NAV_GROUPS,
  MOBILE_NAV_GROUPS,
  enabledNavigationItems,
} from '@/lib/ia/navigation-projection'
import { getDestinationPath } from '@/config/site-catalog'
import { isIndexableSitemapRoute } from '@/lib/seo/sitemap-policy'

const allItems = [...enabledNavigationItems(NAV_GROUPS), ...enabledNavigationItems(MOBILE_NAV_GROUPS)]
if (allItems.some(item => item.href === '/misc' || item.href.startsWith('/misc/'))) {
  throw new Error('navigation must not expose /misc')
}
if (getDestinationPath('misc') !== null) {
  throw new Error('misc must not remain a destination')
}
if (isIndexableSitemapRoute('/misc')) {
  throw new Error('/misc must not be an indexable sitemap route')
}

console.log('misc removal contract passed')
