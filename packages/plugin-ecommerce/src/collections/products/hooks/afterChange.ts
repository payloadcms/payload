import type { CollectionAfterChangeHook } from 'payload'

type Props = {
  variantsSlug: string
}

/**
 * When a product's title changes, re-save its variants so their generated
 * titles pick up the new product title.
 */
export const productsCollectionAfterChange: (args: Props) => CollectionAfterChangeHook =
  ({ variantsSlug }) =>
  async ({ doc, operation, previousDoc, req }) => {
    if (operation !== 'update') {
      return doc
    }

    const newTitle = doc?.title

    if (typeof newTitle !== 'string' || newTitle === previousDoc?.title) {
      return doc
    }

    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const variants = await req.payload.find({
        collection: variantsSlug,
        depth: 0,
        limit: 100,
        overrideAccess: true,
        page,
        req,
        select: { options: true },
        where: { product: { equals: doc.id } },
      })

      for (const variant of variants.docs) {
        // Passing `options` makes the variant's own beforeChange hook rebuild the title.
        // `product` is included because that hook reads it from the incoming data.
        await req.payload.update({
          id: variant.id,
          collection: variantsSlug,
          data: { options: variant.options, product: doc.id },
          depth: 0,
          overrideAccess: true,
          req,
        })
      }

      hasNextPage = variants.hasNextPage
      page += 1
    }

    return doc
  }
