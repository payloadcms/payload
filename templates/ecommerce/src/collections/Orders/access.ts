import type { Access } from 'payload'

import * as qs from 'qs-esm'

type Props = {
  /**
   * Slug of the carts collection, defaults to 'carts'.
   */
  cartsSlug?: string
}

export const ownerOrAdminOrder: (props?: Props) => Access =
  (props) =>
  async ({ id, data, req: { user } }) => {
    if (user?.roles && user?.roles.length && user?.roles?.includes('admin')) {
      return true
    }

    if (user?.id) {
      return {
        customer: {
          equals: user.id,
        },
      }
    }

    return false
  }
