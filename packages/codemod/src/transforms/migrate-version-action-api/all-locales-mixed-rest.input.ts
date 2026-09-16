import type { Payload } from 'payload'

export async function publishAllLocales(payload: Payload, id: string) {
  return fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?draft=false&publishAllLocales=true`,
    { method: 'PATCH' },
  )
}
