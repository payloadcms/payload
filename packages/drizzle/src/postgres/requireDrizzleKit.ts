import { createRequire } from 'module'

import type { RequireDrizzleKit } from '../types.js'

const require = createRequire(import.meta.url)

export const requireDrizzleKit: RequireDrizzleKit = () => {
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
