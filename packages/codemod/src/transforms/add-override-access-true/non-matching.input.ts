import { findOperation, updateOperation } from 'payload'

// Internal operations: a missing value means `false` here, so inserting `true`
// would disable access control on every REST and GraphQL request.
const internalFind = await findOperation({
  collection,
  req,
})

const internalUpdate = await updateOperation({
  collection,
  data: { title: 'hello' },
  req,
})

// Already required in Payload 3 — never touched.
const reset = await payload.resetPassword({
  collection: 'users',
  data: { password: 'x', token: 'y' },
})

// No overrideAccess option exists on these.
const authed = await payload.auth({
  headers: req.headers,
})

const verified = await payload.verifyEmail({
  collection: 'users',
  token: 'y',
})

// A spread may already carry the property. The transform must not guess.
const spread = await payload.find({
  ...baseArgs,
})

// Not a Payload receiver.
const elsewhere = await someService.find({
  collection: 'posts',
})

// Not an object literal argument.
const forwarded = await payload.find(buildArgs())
