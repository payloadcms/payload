import type { RequireDrizzleKit } from '@payloadcms/drizzle/types'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
export const requireDrizzleKit: RequireDrizzleKit = () => require('drizzle-kit/api')
