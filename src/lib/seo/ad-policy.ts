// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { searchPolicyForPath } from './search-policy.ts'

/**
 * Keep advertising inventory away from route families that are intentionally
 * excluded from search. `/data` and `/demos` remain indexable for now and are
 * therefore deliberately not listed here independently.
 */
export function shouldLoadAdSenseForPath(pathname: string): boolean {
  return searchPolicyForPath(pathname) === 'index'
}