import type { UntypedPayloadTypes, User } from 'payload'

import { PayloadTestSDK } from '../shared/sdk/index.js'

/**
 * Preferences live in a collection every config has, so these helpers accept any suite's
 * PayloadTestSDK and talk to the same server without the suite's types.
 */
type AnyPayloadTestSDK = Pick<PayloadTestSDK<UntypedPayloadTypes>, 'serverURL'>

const untyped = ({ serverURL }: AnyPayloadTestSDK) =>
  new PayloadTestSDK<UntypedPayloadTypes>({ serverURL })

/**
 * The local-api endpoint answers a failed operation with the serialized error instead of throwing.
 */
const isSerializedError = (
  value: unknown,
): value is { data?: { errors?: { message?: string }[] }; status: number } =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  typeof value.status === 'number' &&
  value.status >= 400

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
    const sdk = untyped(payload)
    const { docs } = await sdk.find({
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
      return await sdk.create({
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

    const updated = await sdk.update({
      id: prefs.id,
      collection: 'payload-preferences',
      data: { key, user: userRelationship, value: newValue },
      overrideAccess: true,
    })

    if (isSerializedError(updated)) {
      throw new Error(updated.data?.errors?.[0]?.message)
    }

    return updated
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
