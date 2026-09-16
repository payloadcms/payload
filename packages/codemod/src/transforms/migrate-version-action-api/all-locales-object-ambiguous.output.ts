import type { Payload } from 'payload'

declare const computedKey: string
declare const computedValue: unknown
declare const options: Record<string, unknown>
declare const payload: Payload

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: {},
  publishAllLocales: true,
  ...options,
})

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: {},
  publishAllLocales: true,
  [computedKey]: computedValue,
})
