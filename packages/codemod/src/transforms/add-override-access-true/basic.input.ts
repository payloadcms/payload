import type { Config } from 'payload'

// payload.find() relying on the Payload 3 default
const posts = await payload.find({
  collection: 'posts',
})

// payload.findByID() relying on the default
const post = await payload.findByID({
  id: 1,
  collection: 'posts',
})

// Reached through req.payload
const created = await req.payload.create({
  collection: 'posts',
  data: { title: 'hello' },
})

// A global operation
const menu = await payload.findGlobal({
  slug: 'menu',
})

// Already explicit — must not change
const scoped = await payload.find({
  collection: 'posts',
  overrideAccess: false,
})
