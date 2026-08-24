import { supabase } from '@/lib/supabase'
import type { PublishedLabNote } from '@/lib/lab-note-projection'

/** Read public Lab Notes that belong to one experiment slug family. */
export async function getPublishedLabNotes(slugPrefix: string): Promise<PublishedLabNote[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('slug, title, excerpt, published, updated')
    .eq('blog_id', 'lab')
    .eq('status', 'live')
    .like('slug', `${slugPrefix}%`)
    .order('published', { ascending: false })
    .limit(100)

  if (error) {
    console.error(`[lab-notes] failed to load ${slugPrefix}: ${error.message}`)
    return []
  }

  return (data || []) as PublishedLabNote[]
}
