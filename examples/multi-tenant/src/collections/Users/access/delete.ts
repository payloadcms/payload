import type { Access, PayloadRequest } from 'payload'

import { isSuperAdmin } from '../../../access/isSuperAdmin'

import { User } from '@/payload-types'

export const deleteAccess: Access = (args) => {
  const { req }: { req: PayloadRequest } = args

  if (!req.user) {
    return false
  }

  return isSuperAdmin({ req })
}
