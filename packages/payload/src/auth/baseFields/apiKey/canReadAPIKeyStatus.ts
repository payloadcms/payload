import type { FieldAccess } from '../../../fields/config/types.js'

import { UnauthorizedError } from '../../../errors/UnauthorizedError.js'
import { canAccessAdmin } from '../../../utilities/canAccessAdmin.js'

/** Allows users with admin access to read whether an auth document has API keys enabled. */
export const canReadAPIKeyStatus: FieldAccess = async ({ req }) => {
  if (!req.user) {
    return false
  }

  try {
    await canAccessAdmin({ req })
    return true
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return false
    }

    throw error
  }
}
