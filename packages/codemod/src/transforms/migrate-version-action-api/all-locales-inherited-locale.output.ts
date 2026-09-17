import type { Payload, PayloadRequest } from 'payload'
import type { PayloadSDK } from '@payloadcms/sdk'

declare const payload: Payload
declare const req: PayloadRequest
declare const sdk: PayloadSDK

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: { title: 'New Spanish' },
  publishAllLocales: true,
  req,
})

void sdk.update({
  action: 'publish',
  collection: 'posts',
  data: { title: 'Default locale' },
  locale: 'all',
})

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: { title: 'Already all' },
  locale: 'all'
})
