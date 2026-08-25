import type { Payload } from 'payload'

export async function fetchPosts(payload: Payload, id: string) {
  const list = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts?draft=true`,
  )
  const doc = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?draft=false`,
  )
  const created = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts?draft=true`,
    { method: 'POST' },
  )

  return { created, doc, list }
}
