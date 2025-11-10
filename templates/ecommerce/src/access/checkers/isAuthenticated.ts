import type { Access } from 'payload'

/**
 * Atomic access checker that verifies if the user is authenticated (any role).
 *
 * @returns true if user is authenticated, false otherwise
 */
export const isAuthenticated: Access = ({ req }) => {
  return !!req.user
}
