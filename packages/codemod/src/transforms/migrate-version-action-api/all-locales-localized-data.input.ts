import type { Payload } from 'payload'

declare const payload: Payload

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: { title: 'New Spanish' },
  locale: 'es',
  publishAllLocales: true,
})
