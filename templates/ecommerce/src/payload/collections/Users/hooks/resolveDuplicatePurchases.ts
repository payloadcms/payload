import type { FieldHook } from 'payload/types'

import type { User } from '../../../payload-types'

export const resolveDuplicatePurchases: FieldHook<User> = async ({ value, operation }) => {
  if ((operation === 'create' || operation === 'update') && value) {
    return Array.from(
      new Set(
        value?.map(purchase => (typeof purchase === 'string' ? purchase : purchase.id)) || [],
      ),
    )
  }

  return
}
