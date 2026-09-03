export interface LabDiscoveryProject {
  id: string
  name: string
  description: string
  status: string
  nextGoals?: readonly string[]
  timeline?: ReadonlyArray<{ name: string; result?: string }>
}

export interface LabProjectSearchResult {
  id: string
  slug: string
  title: string
  excerpt: string
  labels: string[]
  published: null
  cover_image: null
  blog_id: 'lab'
  href: string
  result_type: 'project'
}

function projectSearchText(project: LabDiscoveryProject): string {
  return [
    project.id,
    project.name,
    project.description,
    ...(project.nextGoals || []),
    ...(project.timeline || []).flatMap(item => [item.name, item.result || '']),
  ].join(' ').toLocaleLowerCase()
}

export function getPublicLabProjectSearchResults(
  query: string,
  source: readonly LabDiscoveryProject[],
): LabProjectSearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return []

  return source
    .filter(project => projectSearchText(project).includes(normalizedQuery))
    .map(project => ({
      id: `project:${project.id}`,
      slug: project.id,
      title: project.name,
      excerpt: project.description,
      labels: [project.status],
      published: null,
      cover_image: null,
      blog_id: 'lab' as const,
      href: `/labs/${project.id}`,
      result_type: 'project' as const,
    }))
}

export function getPublicLabProjectPaths(source: readonly Pick<LabDiscoveryProject, 'id'>[]): string[] {
  return source.map(project => `/labs/${project.id}`)
}
