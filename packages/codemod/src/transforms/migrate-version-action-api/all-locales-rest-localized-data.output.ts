import type { Payload } from 'payload'

export async function updateAllLocales(
  payload: Payload,
  id: string,
  data: { title: string },
) {
  const created = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts?locale=es&action=publish&publishAllLocales=true`,
    { method: 'POST', body: JSON.stringify({ title: 'New Spanish' }) },
  )
  const updated = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?locale=fr&action=publish&publishAllLocales=true`,
    { method: 'PATCH', body: JSON.stringify(data) },
  )
  const empty = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?locale=all&action=publish`,
    { method: 'PATCH', body: JSON.stringify({}) },
  )
  const noBody = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?locale=all&action=publish`,
    { method: 'PATCH' },
  )

  return { created, empty, noBody, updated }
}
