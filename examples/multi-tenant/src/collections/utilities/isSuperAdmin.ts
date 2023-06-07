import type { User } from 'payload/generated-types'

import { checkUserRoles } from './checkUserRoles'

export const isSuperAdmin = (user: User): boolean => checkUserRoles(['super-admin'], user)
