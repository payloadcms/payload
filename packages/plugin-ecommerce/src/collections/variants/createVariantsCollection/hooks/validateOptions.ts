import type { Validate } from 'payload'

type Props = {
  productsCollectionSlug?: string
}

export const validateOptions: (props?: Props) => Validate =
  (props) =>
  async (values, { data, req }) => {
    const { productsCollectionSlug = 'products' } = props || {}
    const { t } = req

    if (!values || values.length === 0) {
      // @ts-expect-error - TODO: Fix types
      return t('plugin-ecommerce:variantOptionsRequired')
    }

    const productID = data.product

    if (!productID) {
      // @ts-expect-error - TODO: Fix types
      return t('plugin-ecommerce:productRequired')
    }

    const product = await req.payload.findByID({
      id: productID,
      collection: productsCollectionSlug,
      depth: 1,
      joins: {
        variants: {
          // No limit: the duplicate check below must see every sibling variant.
          // Without this the join falls back to the adapter default of 10, so a
          // combination already used by an 11th or later variant passes validation.
          limit: 0,
          where: {
            deletedAt: { exists: false },
            ...(data.id && {
              id: {
                not_equals: data.id, // exclude the current variant from the search
              },
            }),
          },
        },
      },
      overrideAccess: true,
      select: {
        variants: true,
        variantTypes: true,
      },
      user: req.user,
    })

    // @ts-expect-error - TODO: Fix types
    const variants = product.variants?.docs ?? []

    // @ts-expect-error - TODO: Fix types
    if (values.length < product?.variantTypes?.length) {
      // @ts-expect-error - TODO: Fix types
      return t('plugin-ecommerce:variantOptionsRequiredAll')
    }

    if (variants.length > 0) {
      const existingOptions: (number | string)[][] = []

      variants.forEach((variant: any) => {
        existingOptions.push(variant.options)
      })

      const exists = existingOptions.some(
        (combo) => combo.length === values.length && combo.every((val) => values.includes(val)),
      )

      if (exists) {
        // @ts-expect-error - TODO: Fix types
        return t('plugin-ecommerce:variantOptionsAlreadyExists')
      }
    }

    return true
  }
