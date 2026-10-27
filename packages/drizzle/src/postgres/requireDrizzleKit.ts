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
    generateMigration: async (before, after, options) => {
      const statements: string[] = await generateMigration(before, after, options)

      // Payload can connect to a pre-created schema, including after dropDatabase recreates it.
      return statements.map((statement) =>
        statement.replace(/^CREATE SCHEMA (?!IF NOT EXISTS )/, 'CREATE SCHEMA IF NOT EXISTS '),
      )
    },
    pushSchema,
    upSnapshot: (snapshot) => up(snapshot).snapshot,
  }
}
