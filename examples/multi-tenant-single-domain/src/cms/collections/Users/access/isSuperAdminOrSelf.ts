import type { Access } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { isAccessingSelf } from './isAccessingSelf'

export const isSuperAdminOrSelf: Access = (args) => isSuperAdmin(args) || isAccessingSelf(args)
