import type { Payload } from '../../../types/index.js'
import type { ConfigSnapshot } from './types.js'

const CONFIG_STATE_SLUG = 'payload-config-state'

export async function readConfigState(payload: Payload): Promise<ConfigSnapshot | null> {
  try {
    const result = await payload.find({
      collection: CONFIG_STATE_SLUG,
      limit: 1,
      pagination: false,
    })
    if (result.docs.length === 0) {
      return null
    }
    return result.docs[0]!.state as ConfigSnapshot
  } catch {
    return null
  }
}

export async function writeConfigState(payload: Payload, snapshot: ConfigSnapshot): Promise<void> {
  const existing = await payload.find({
    collection: CONFIG_STATE_SLUG,
    limit: 1,
    pagination: false,
  })

  if (existing.docs.length === 0) {
    await payload.create({
      collection: CONFIG_STATE_SLUG,
      data: { state: snapshot },
    })
  } else {
    await payload.update({
      id: existing.docs[0]!.id,
      collection: CONFIG_STATE_SLUG,
      data: { state: snapshot },
    })
  }
}
