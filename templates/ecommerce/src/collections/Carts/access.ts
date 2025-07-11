import type { Access } from 'payload'

type Props = {
  /**
   * Slug of the carts collection, defaults to 'carts'.
   */
  cartsSlug?: string
}

export const ownerOrAdminCart: (props?: Props) => Access =
  (props) =>
  async ({ id, data, req: { payload, user } }) => {
    const { cartsSlug = 'carts' } = props || {}

    if (user?.roles && user?.roles.length && user?.roles?.includes('admin')) {
      return true
    }

    if (!id) {
      return false
    }

    // We need to fetch the caart data to check if the customer matches the user
    // This is because the cart may not have a customer field if it was created by a guest
    const cartData = await payload.findByID({
      id,
      collection: 'carts',
      depth: 0,
      select: {
        customer: true,
      },
    })

    if (cartData?.customer) {
      return {
        customer: {
          equals: user?.id,
        },
      }
    }

    return true
  }
