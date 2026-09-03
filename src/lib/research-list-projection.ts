// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { toPlainTextExcerpt } from './content-excerpt.ts'

export interface ResearchListPostInput {
  slug: string
  title: string
  excerpt: string | null
  labels: string[]
  published: string
}

export interface ResearchListPost extends ResearchListPostInput {
  excerpt: string
}

export function projectResearchListPost(post: ResearchListPostInput): ResearchListPost {
  return {
    ...post,
    excerpt: toPlainTextExcerpt(post.excerpt),
  }
}

export function projectResearchListPosts(posts: ResearchListPostInput[]): ResearchListPost[] {
  return posts.map(projectResearchListPost)
}
