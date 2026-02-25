# Payload SDK

Package to allow querying Payload REST API in a fully type safe way. Has support for all necessary operations, including auth, type safe `select`, `populate`, `joins` properties and simplified file uploading. Its interface is _very_ similar to the Local API.

```ts
import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from './payload-types'

// Pass your config from generated types as generic
const sdk = new PayloadSDK<Config>({
  baseURL: 'https://example.com/api',
})

// Find operation
const posts = await sdk.find({
  collection: 'posts',
  draft: true,
  limit: 10,
  locale: 'en',
  page: 1,
  where: { _status: { equals: 'published' } },
})

// Find by ID operation
const posts = await sdk.findByID({
  id,
  collection: 'posts',
  draft: true,
  locale: 'en',
})

// Auth login operation
const result = await sdk.login({
  collection: 'users',
  data: {
    email: 'dev@payloadcms.com',
    password: '12345',
  },
})

// Create operation
const result = await sdk.create({
  collection: 'posts',
  data: { text: 'text' },
})

// Create operation with a file
// `file` can be either a Blob | File object or a string URL
const result = await sdk.create({ collection: 'media', file, data: {} })

// Count operation
const result = await sdk.count({ collection: 'posts', where: { id: { equals: post.id } } })

// Update (by ID) operation
const result = await sdk.update({
  collection: 'posts',
  id: post.id,
  data: {
    text: 'updated-text',
  },
})

// Update (bulk) operation
const result = await sdk.update({
  collection: 'posts',
  where: {
    id: {
      equals: post.id,
    },
  },
  data: { text: 'updated-text-bulk' },
})

// Delete (by ID) operation
const result = await sdk.delete({ id: post.id, collection: 'posts' })

// Delete (bulk) operation
const result = await sdk.delete({ where: { id: { equals: post.id } }, collection: 'posts' })

// Find Global operation
const result = await sdk.findGlobal({ slug: 'global' })

// Update Global operation
const result = await sdk.updateGlobal({ slug: 'global', data: { text: 'some-updated-global' } })

// Auth Login operation
const result = await sdk.login({
  collection: 'users',
  data: { email: 'dev@payloadcms.com', password: '123456' },
})

// Auth Me operation
const result = await sdk.me(
  { collection: 'users' },
  {
    headers: {
      Authorization: `JWT  ${user.token}`,
    },
  },
)

// Auth Refresh Token operation
const result = await sdk.refreshToken(
  { collection: 'users' },
  { headers: { Authorization: `JWT ${user.token}` } },
)

// Auth Forgot Password operation
const result = await sdk.forgotPassword({
  collection: 'users',
  data: { email: user.email },
})

// Auth Reset Password operation
const result = await sdk.resetPassword({
  collection: 'users',
  data: { password: '1234567', token: resetPasswordToken },
})

// Find Versions operation
const result = await sdk.findVersions({
  collection: 'posts',
  where: { parent: { equals: post.id } },
})

// Find Version by ID operation
const result = await sdk.findVersionByID({ collection: 'posts', id: version.id })

// Restore Version operation
const result = await sdk.restoreVersion({
  collection: 'posts',
  id,
})

// Find Global Versions operation
const result = await sdk.findGlobalVersions({
  slug: 'global',
})

// Find Global Version by ID operation
const result = await sdk.findGlobalVersionByID({ id: version.id, slug: 'global' })

// Restore Global Version operation
const result = await sdk.restoreGlobalVersion({
  slug: 'global',
  id,
})
```

Every operation has optional 3rd parameter which is used to add additional data to the RequestInit object (like headers):

```ts
await sdk.me(
  {
    collection: 'users',
  },
  {
    // RequestInit object
    headers: {
      Authorization: `JWT ${token}`,
    },
  },
)
```

To query custom endpoints, you can use the `request` method, which is used internally for all other methods:

```ts
await sdk.request({
  method: 'POST',
  path: '/send-data',
  json: {
    id: 1,
  },
})
```

Custom `fetch` implementation and `baseInit` for shared `RequestInit` properties:

```ts
const sdk = new PayloadSDK<Config>({
  baseInit: { credentials: 'include' },
  baseURL: 'https://example.com/api',
  fetch: async (url, init) => {
    console.log('before req')
    const response = await fetch(url, init)
    console.log('after req')
    return response
  },
})
```
