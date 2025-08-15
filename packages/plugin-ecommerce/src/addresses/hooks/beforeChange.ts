import type { CollectionBeforeChangeHook } from 'payload'

import type { AccessConfig } from '../../types.js'

interface Props {
  isCustomerField: AccessConfig['isCustomerField']
}

export const beforeChange: (args: Props) => CollectionBeforeChangeHook =
  ({ isCustomerField }) =>
  async ({ data, req }) => {
    const isCustomer = await isCustomerField({ req })

    // Ensure that the customer field is set to the current user's ID if the user is a customer.
    // Admins can set to any customer.
    if (req.user && isCustomer) {
      data.customer = req.user.id
    }
  }
