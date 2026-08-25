import type { Payload } from 'payload'

export async function fetchPosts(payload: Payload, id: string) {
  const list = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts?version=latest`,
  )
  const doc = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?version=published`,
  )
  const created = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts?action=saveDraft`,
    { method: 'POST' },
  )

  return { created, doc, list }
}
