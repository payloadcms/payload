import type { Payload } from 'payload'
import type { PayloadSDK } from '@payloadcms/sdk'

export async function updateAllLocales(payload: Payload, sdk: PayloadSDK) {
  await payload.update({
    action: 'publish',
    collection: 'posts',
    data: { title: 'Published' },
    locale: 'all',
  })

  await payload.updateGlobal({
    action: 'unpublish',
    data: {},
    locale: 'all',
    slug: 'homepage'
  })

  await sdk.create({
    action: 'publish',
    collection: 'posts',
    data: { title: 'Created' },
    locale: 'all'
  })

  await payload.update({
    action: 'publish',
    collection: 'posts',
    data: {}
  })
}
