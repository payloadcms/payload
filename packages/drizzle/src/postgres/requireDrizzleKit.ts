import { createRequire } from 'module'

import type { RequireDrizzleKit } from '../types.js'

const require = createRequire(import.meta.url)
export const requireDrizzleKit: RequireDrizzleKit = () => require('drizzle-kit/api')
