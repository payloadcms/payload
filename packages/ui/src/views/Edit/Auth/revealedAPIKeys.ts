/**
 * A read-once handoff for a raw API key, so the value a save just returned survives the
 * redirect the Edit view performs after a create.
 *
 * The Admin Panel is one catch-all route, so that redirect is a client-side navigation and
 * this module stays loaded across it - while a refresh, which is when a one-time secret
 * should stop being shown, tears it down. Deliberately not `sessionStorage`: a working
 * credential should not sit in storage that any script on the origin can read.
 */
const revealedAPIKeys = new Map<string, string>()

const keyFor = ({
  id,
  collectionSlug,
}: {
  collectionSlug: string | undefined
  id: number | string | undefined
}): string => `${collectionSlug ?? ''}:${id ?? ''}`

export const holdRevealedAPIKey = ({
  id,
  apiKey,
  collectionSlug,
}: {
  apiKey: string
  collectionSlug: string | undefined
  id: number | string | undefined
}): void => {
  if (!id) {
    return
  }

  revealedAPIKeys.set(keyFor({ id, collectionSlug }), apiKey)
}

/** Returns the held key, if any, and drops it - so it is only ever shown once. */
export const takeRevealedAPIKey = ({
  id,
  collectionSlug,
}: {
  collectionSlug: string | undefined
  id: number | string | undefined
}): string | undefined => {
  const mapKey = keyFor({ id, collectionSlug })
  const apiKey = revealedAPIKeys.get(mapKey)

  revealedAPIKeys.delete(mapKey)

  return apiKey
}
