import type { FieldAccess } from '../../../fields/config/types.js'

import { UnauthorizedError } from '../../../errors/UnauthorizedError.js'
import { canAccessAdmin } from '../../../utilities/canAccessAdmin.js'

/** Allows API key creation and updates only for users with admin access. */
export const canCreateOrUpdateAPIKey: FieldAccess = async ({ req }) => {
  if (!req.user) {
    return false
  }

  try {
    await canAccessAdmin({ req })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return false
    }

    throw error
  }

  return true
}
