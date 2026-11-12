import type { CollectionAfterChangeHook } from 'payload'

type Props = {
  variantsSlug: string
}

/**
 * When a product's title changes, refresh the generated titles of its variants.
 *
 * The title is built by the variants collection's own beforeChange hook, so each variant is
 * re-saved with its existing `options` and that hook regenerates the title.
 *
 * A normal (non-draft) update of a variant that has a pending, unpublished draft would start
 * from that draft and publish its changes. Those variants are handled separately: the draft is
 * updated as a draft, and only the regenerated `title` is copied onto the published record.
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
      // `draft: true` returns the latest version of each variant, including unpublished drafts
      const variants = await req.payload.find({
        collection: variantsSlug,
        depth: 0,
        draft: true,
        limit: 100,
        overrideAccess: true,
        page,
        req,
        select: { _status: true, options: true },
        where: { product: { equals: doc.id } },
      })

      for (const variant of variants.docs) {
        // Passing `options` makes the variant's own beforeChange hook rebuild the title.
        // `product` is included because that hook reads it from the incoming data.
        const data = { options: variant.options, product: doc.id }

        let hasPendingDraft = false

        if (variant._status === 'draft') {
          const published = await req.payload.findByID({
            id: variant.id,
            collection: variantsSlug,
            depth: 0,
            draft: false,
            overrideAccess: true,
            req,
            select: { _status: true },
          })

          hasPendingDraft = published?._status === 'published'
        }

        if (hasPendingDraft) {
          const updatedDraft = await req.payload.update({
            id: variant.id,
            collection: variantsSlug,
            data,
            depth: 0,
            draft: true,
            overrideAccess: true,
            req,
          })

          await req.payload.db.updateOne({
            id: variant.id,
            collection: variantsSlug,
            data: { title: updatedDraft.title },
            req,
          })
        } else {
          await req.payload.update({
            id: variant.id,
            collection: variantsSlug,
            data,
            depth: 0,
            overrideAccess: true,
            req,
          })
        }
      }

      hasNextPage = variants.hasNextPage
      page += 1
    }

    return doc
  }
