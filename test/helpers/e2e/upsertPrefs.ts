import type { PayloadTestSDK } from 'helpers/sdk/index.js'
import type { GeneratedTypes } from 'helpers/sdk/types.js'
import type { TypedUser } from 'payload'

export const upsertPrefs = async <
  TConfig extends GeneratedTypes<any>,
  TGeneratedTypes extends GeneratedTypes<any>,
>({
  payload,
  user,
  value,
}: {
  payload: PayloadTestSDK<TConfig>
  user: TypedUser
  value: Record<string, any>
}): Promise<TGeneratedTypes['collections']['payload-preferences']> => {
  let prefs = await payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      where: {
        and: [
          { key: { equals: 'text-fields-list' } },
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
        key: 'text-fields-list',
        user: {
          relationTo: user.collection,
          value: user.id,
        },
        value,
      },
    })
  } else {
    prefs = await payload.update({
      collection: 'payload-preferences',
      id: prefs.id,
      data: {
        value: {
          ...(prefs?.value ?? {}),
          ...value,
        },
      },
    })
  }

  return prefs
}
