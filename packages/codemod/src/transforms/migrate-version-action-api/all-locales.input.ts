import type { Payload } from 'payload'
import type { PayloadSDK } from '@payloadcms/sdk'

export async function updateAllLocales(payload: Payload, sdk: PayloadSDK) {
  await payload.update({
    action: 'publish',
    collection: 'posts',
    data: { title: 'Published' },
    publishAllLocales: true,
  })

  await payload.updateGlobal({
    action: 'unpublish',
    data: {},
    locale: 'es',
    slug: 'homepage',
    unpublishAllLocales: true,
  })

  await sdk.create({
    action: 'publish',
    collection: 'posts',
    data: {},
    locale: 'en',
    publishAllLocales: true,
  })

  await payload.update({
    action: 'publish',
    collection: 'posts',
    data: {},
    publishAllLocales: false,
    unpublishAllLocales: false,
  })
}
