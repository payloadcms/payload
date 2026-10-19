import type { validateJSONSchema as validateJSONSchemaOnServer } from './validateJSONSchema.js'

/** The browser version of `validateJSONSchema.ts`, which explains why it does nothing */
export const validateJSONSchema: typeof validateJSONSchemaOnServer = () => Promise.resolve(true)
