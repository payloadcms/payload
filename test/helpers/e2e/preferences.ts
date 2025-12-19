import type { PayloadTestSDK } from 'helpers/sdk/index.js'
import type { GeneratedTypes } from 'helpers/sdk/types.js'
import type { TypedUser, User } from 'payload'

export const upsertPreferences = async <
  TConfig extends GeneratedTypes<any>,
  TGeneratedTypes extends GeneratedTypes<any>,
>({
  payload,
  user,
  value,
  key,
}: {
  key: string
  payload: PayloadTestSDK<TConfig>
  user: TypedUser
  value: any
}): Promise<TGeneratedTypes['collections']['payload-preferences']> => {
  try {
    let prefs = await payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        where: {
          and: [
            { key: { equals: key } },
            { 'user.value': { equals: user.id } },
            { 'user.relationTo': { equals: user.collection } },
          ],
        },
      })
      ?.then((res) => res.docs?.[0])

    if (!prefs) {
      prefs = await payload.create({
        collection: 'payload-preferences',
        depth: 0,
        data: {
          key,
          user: {
            relationTo: user.collection,
            value: user.id,
          },
          value,
        },
      })
    } else {
      const newValue = typeof value === 'object' ? { ...(prefs?.value || {}), ...value } : value

      prefs = await payload.update({
        collection: 'payload-preferences',
        id: prefs.id,
        data: {
          key,
          user: {
            collection: user.collection,
            value: user.id,
          },
          value: newValue,
        },
      })

      if (prefs?.status >= 400) {
        throw new Error(prefs.data?.errors?.[0]?.message)
      }

      return prefs
    }
  } catch (e) {
    console.error('Error upserting prefs', e)
  }
}

export const deletePreferences = async <TConfig extends GeneratedTypes<any>>({
  payload,
  user,
  key,
}: {
  key: string
  payload: PayloadTestSDK<TConfig>
  user: User
}): Promise<void> => {
  try {
    await payload.delete({
      collection: 'payload-preferences',
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
