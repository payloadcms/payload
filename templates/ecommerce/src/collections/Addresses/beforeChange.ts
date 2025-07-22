import { checkRole } from '@/access/checkRole'
import { CollectionBeforeChangeHook } from 'payload'

export const beforeChangeAddress: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Ensure that the customer field is set to the current user's ID if the user is a customer.
  // Admins can set to any customer.
  if (req.user && checkRole(['customer'], req.user)) {
    data.customer = req.user.id
  }
}
