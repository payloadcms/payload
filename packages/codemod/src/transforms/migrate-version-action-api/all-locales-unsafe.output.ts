import type { Payload } from 'payload'

declare const payload: Payload
declare const publishEverywhere: boolean
declare const selectedLocale: string

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: {},
  publishAllLocales: publishEverywhere,
})

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: {},
  locale: selectedLocale,
  publishAllLocales: true,
})

void payload.update({
  action: 'publish',
  collection: 'posts',
  data: {},
  publishAllLocales: true,
  unpublishAllLocales: true,
})

void payload.update({
  action: 'unpublish',
  collection: 'posts',
  data: {},
  publishAllLocales: true,
})

void payload.update({
  collection: 'posts',
  data: {},
  publishAllLocales: true,
})

const detachedOptions = {
  action: 'publish',
  collection: 'posts',
  data: {},
  publishAllLocales: true,
}

void payload.update(detachedOptions)
void fetch('/api/posts/1?action=publish&publishAllLocales=true', { method: 'PATCH' })

const detachedMutation = `
  mutation PublishEverywhere {
    updatePost(id: "1", action: publish, publishAllLocales: true, data: {}) { id }
  }
`

void detachedMutation
