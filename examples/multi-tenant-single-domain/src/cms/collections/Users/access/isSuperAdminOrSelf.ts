import type { Access } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin.js'
import { isAccessingSelf } from './isAccessingSelf.js'

export const isSuperAdminOrSelf: Access = (args) => isSuperAdmin(args) || isAccessingSelf(args)
