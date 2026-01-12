import type { CollectionBeforeChangeHook } from 'payload'

import type { AccessConfig } from '../../../types/index.js'

interface Props {
  customerOnlyFieldAccess: AccessConfig['customerOnlyFieldAccess']
}

export const beforeChange: (args: Props) => CollectionBeforeChangeHook =
  ({ customerOnlyFieldAccess }) =>
  async ({ data, req }) => {
    const isCustomer = await customerOnlyFieldAccess({ req })

    // Ensure that the customer field is set to the current user's ID if the user is a customer.
    // Admins can set to any customer.
    if (req.user && isCustomer) {
      data.customer = req.user.id
    }
  }
