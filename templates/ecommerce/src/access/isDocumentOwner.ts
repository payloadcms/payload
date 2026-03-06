import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Atomic access checker that verifies if the user owns the document being accessed.
 * Returns a Where query to filter documents by the customer field.
 *
 * Admins have full access, authenticated users get filtered by customer field,
 * and unauthenticated users are denied access.
 *
 * @returns true for admins, Where query for customers, false for guests
 */
export const isDocumentOwner: Access = ({ req }) => {
  // Admin has full access
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }

  // Authenticated user - return Where query to filter by customer
  if (req.user?.id) {
    return {
      customer: {
        equals: req.user.id,
      },
    }
  }

  // Guest - no access
  return false
}
