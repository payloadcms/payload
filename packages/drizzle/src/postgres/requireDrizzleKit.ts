import { createRequire } from 'module'

import type { RequireDrizzleKit } from '../types.js'

const require = createRequire(import.meta.url)

export const requireDrizzleKit: RequireDrizzleKit = () => {
  const {
    generateDrizzleJson,
    generateMigration,
    pushSchema,
    up,
  } = require('drizzle-kit/payload/postgres')

  return {
    generateDrizzleJson,
    generateMigration,
    pushSchema,
    upSnapshot: (snapshot) => up(snapshot).snapshot,
  }
}
