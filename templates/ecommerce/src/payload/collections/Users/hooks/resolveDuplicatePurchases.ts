import type { FieldHook } from 'payload/types'

import type { User } from '../../../payload-types'

export const resolveDuplicatePurchases: FieldHook<User> = async ({ operation, value }) => {
  if ((operation === 'create' || operation === 'update') && value) {
    return Array.from(
      new Set(
        value?.map((purchase) => (typeof purchase === 'object' ? purchase.id : purchase)) || [],
      ),
    )
  }

  return
}
