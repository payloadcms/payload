import type { Payload } from 'payload'

export async function updateAllLocales(payload: Payload, id: string) {
  const replacer = (key: string, value: unknown) =>
    key === '' ? { title: 'Injected at the root' } : value
  const stringifyOptions = [replacer] as const

  const replaced = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?locale=es&action=publish&publishAllLocales=true`,
    { method: 'PATCH', body: JSON.stringify({}, replacer) },
  )
  const unresolved = await fetch(
    `${payload.config.serverURL}${payload.config.routes.api}/posts/${id}?locale=fr&action=publish&publishAllLocales=true`,
    { method: 'PATCH', body: JSON.stringify({}, ...stringifyOptions) },
  )

  return { replaced, unresolved }
}
