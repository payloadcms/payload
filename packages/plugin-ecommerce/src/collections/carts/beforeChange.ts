import type { CollectionBeforeChangeHook } from '@ruya.sa/payload'

import crypto from 'crypto'

type Props = {
  productsSlug: string
  variantsSlug: string
}

export const beforeChangeCart: (args: Props) => CollectionBeforeChangeHook =
  ({ productsSlug, variantsSlug }) =>
  async ({ data, operation, req }) => {
    // Generate a secret for guest cart access on creation
    if (operation === 'create' && !data.customer && !data.secret) {
      // Generate a cryptographically secure random string
      const secret = crypto.randomBytes(20).toString('hex')
      data.secret = secret

      // Store in context so afterRead hook can include it in the creation response
      if (!req.context) {
        req.context = {}
      }
      req.context.newCartSecret = secret
    }

    // Update subtotal based on items in the cart
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
