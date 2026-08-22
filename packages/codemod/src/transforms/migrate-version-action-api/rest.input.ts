export async function fetchPosts(api: string, id: string) {
  const list = await fetch(`${api}/posts?draft=true`)
  const doc = await fetch(`/api/posts/${id}?draft=false`)
  const created = await fetch('/api/posts?draft=true', { method: 'POST' })

  return { created, doc, list }
}
