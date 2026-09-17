import type { Payload } from 'payload'

export async function updateAllLocales(payload: Payload, id: string) {
  const published = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?action=publish&publishAllLocales=true`,
    { method: 'PATCH' },
  )
  const unpublished = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?locale=es&unpublishAllLocales=true&action=unpublish`,
    { method: 'PATCH' },
  )
  const unchangedScope = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?publishAllLocales=false&depth=1`,
    { method: 'PATCH' },
  )

  return { published, unchangedScope, unpublished }
}
