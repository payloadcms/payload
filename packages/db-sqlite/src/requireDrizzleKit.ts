import type { RequireDrizzleKit } from '@payloadcms/drizzle/types'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

/**
 * Dynamically requires the `drizzle-kit` package to access the `generateSQLiteDrizzleJson` and `pushSQLiteSchema` functions and exports them generically to call them from @payloadcms/drizzle.
 */
export const requireDrizzleKit: RequireDrizzleKit = () => {
  const {
    generateSQLiteDrizzleJson: generateDrizzleJson,
    pushSQLiteSchema: pushSchema,
  } = require('drizzle-kit/api')
  return { generateDrizzleJson, pushSchema }
}
