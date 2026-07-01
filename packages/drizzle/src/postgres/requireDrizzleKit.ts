import type { RequireDrizzleKit } from '../types.js'

export const requireDrizzleKit: RequireDrizzleKit = () => {
  const { createRequire } = require('module')
  const require = createRequire(import.meta.url)
  const {
    generateDrizzleJson,
    generateMigration,
    pushSchema,
    upPgSnapshot,
  } = require('drizzle-kit/api')

  return {
    generateDrizzleJson,
    generateMigration,
    pushSchema,
    upSnapshot: upPgSnapshot,
  }
}
