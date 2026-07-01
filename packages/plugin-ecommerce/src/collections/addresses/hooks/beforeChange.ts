import type { CollectionBeforeChangeHook, FieldAccess } from 'payload'

interface Props {
  isCustomer?: FieldAccess
}

export const beforeChange: (args: Props) => CollectionBeforeChangeHook =
  ({ isCustomer }) =>
  async (accessArgs) => {
    const { data, req } = accessArgs
    if (!isCustomer) {
      return data
    }

    const userIsCustomer = await isCustomer({ ...accessArgs, global: null })

    // Ensure that the customer field is set to the current user's ID if the user is a customer.
    // Admins can set to any customer.
    if (req.user && userIsCustomer) {
      data.customer = req.user.id
    }

    return data
  }
