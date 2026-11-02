import type { Config, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

const unrelated: Config = {
  collections: [],
}

const untyped = {
  slug: 'untyped',
  fields: [],
}

// Sanitized configs are internal runtime types with a required `authorship`
// property, so the codemod must leave them untouched.
const sanitizedCollection: SanitizedCollectionConfig = {
  slug: 'sanitized-collection',
}

const sanitizedGlobal: SanitizedGlobalConfig = {
  slug: 'sanitized-global',
}
