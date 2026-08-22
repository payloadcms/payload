export async function fetchPosts(api: string, id: string) {
  const list = await fetch(`${api}/posts?version=latest`)
  const doc = await fetch(`/api/posts/${id}?version=published`)
  const created = await fetch('/api/posts?action=saveDraft', { method: 'POST' })

  return { created, doc, list }
}
