import type { CollectionBeforeChangeHook } from 'payload'

type Props = {
  productsSlug: string
  variantsSlug: string
}

export const updateSubtotalHook: (args: Props) => CollectionBeforeChangeHook =
  ({ productsSlug, variantsSlug }) =>
  async ({ data, req }) => {
    if (data.items && Array.isArray(data.items)) {
      const priceField = `priceIn${data.currency}`

      let subtotal = 0

      for (const item of data.items) {
        if (item.variant) {
          const id = typeof item.variant === 'object' ? item.variant.id : item.variant

          const variant = await req.payload.findByID({
            id,
            collection: variantsSlug,
            depth: 0,
            select: {
              [priceField]: true,
            },
          })

          subtotal += variant[priceField] * item.quantity
        } else {
          const id = typeof item.product === 'object' ? item.product.id : item.product

          const product = await req.payload.findByID({
            id,
            collection: productsSlug,
            depth: 0,
            select: {
              [priceField]: true,
            },
          })

          subtotal += product[priceField] * item.quantity
        }
      }

      data.subtotal = subtotal
    } else {
      data.subtotal = 0
    }
  }
