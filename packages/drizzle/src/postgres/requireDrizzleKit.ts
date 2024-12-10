import { generateDrizzleJson, generateMigration, pushSchema, upPgSnapshot } from 'drizzle-kit/api'

import type { RequireDrizzleKit } from '../types.js'
export const requireDrizzleKit: RequireDrizzleKit = () => ({
  generateDrizzleJson,
  generateMigration,
  // @ts-expect-error
  pushSchema,
  // @ts-expect-error
  upSnapshot: upPgSnapshot,
})
