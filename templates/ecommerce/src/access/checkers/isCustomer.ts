import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Atomic access checker that verifies if the user has the customer role.
 *
 * @returns true if user is a customer, false otherwise
 */
export const isCustomer: Access = ({ req }) => {
  if (req.user) {
    return checkRole(['customer'], req.user)
  }

  return false
}
