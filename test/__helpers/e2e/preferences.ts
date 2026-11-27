import type { UntypedPayloadTypes, User } from 'payload'

import { PayloadTestSDK } from '../shared/sdk/index.js'

/**
 * Preferences live in a collection every config has, so these helpers accept any suite's
 * PayloadTestSDK and talk to the same server without the suite's types.
 */
type AnyPayloadTestSDK = Pick<PayloadTestSDK<UntypedPayloadTypes>, 'serverURL'>

const untyped = ({ serverURL }: AnyPayloadTestSDK) =>
  new PayloadTestSDK<UntypedPayloadTypes>({ serverURL })

export const upsertPreferences = async ({
  key,
  payload,
  user,
  value,
}: {
  key: string
  payload: AnyPayloadTestSDK
  user: User
  value: unknown
}) => {
  try {
    const untypedPayload = untyped(payload)
    const { docs } = await untypedPayload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { key: { equals: key } },
          { 'user.value': { equals: user.id } },
          { 'user.relationTo': { equals: user.collection } },
        ],
      },
    })
    const prefs = docs[0]
    const userRelationship = { relationTo: user.collection, value: user.id }

    if (!prefs) {
      return await untypedPayload.create({
        collection: 'payload-preferences',
        data: { key, user: userRelationship, value },
        depth: 0,
        overrideAccess: true,
      })
    }

    const newValue =
      typeof value === 'object' && value !== null && typeof prefs.value === 'object'
        ? { ...prefs.value, ...value }
        : value

    return await untypedPayload.update({
      id: prefs.id,
      collection: 'payload-preferences',
      data: { key, user: userRelationship, value: newValue },
      overrideAccess: true,
    })
  } catch (e) {
    console.error('Error upserting prefs', e)
  }
}

export const deletePreferences = async ({
  key,
  payload,
  user,
}: {
  key: string
  payload: AnyPayloadTestSDK
  user: User
}): Promise<void> => {
  try {
    await untyped(payload).delete({
      collection: 'payload-preferences',
      overrideAccess: true,
      where: {
        and: [
          { key: { equals: key } },
          { 'user.value': { equals: user.id } },
          { 'user.relationTo': { equals: user.collection } },
        ],
      },
    })
  } catch (e) {
    console.error('Error deleting prefs', e)
  }
}
