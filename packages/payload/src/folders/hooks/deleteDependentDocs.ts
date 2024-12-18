import type { CollectionAfterDeleteHook, CollectionSlug } from '../../index.js'
export const deleteDependentDocs = async ({
  collection,
  doc,
  relatedCollectionSlug,
  req,
}: {
  relatedCollectionSlug: CollectionSlug
} & Parameters<CollectionAfterDeleteHook>[0]) => {
  // folders that rely on this folder
  await req.payload.delete({
    collection: collection.slug,
    where: {
      parentFolder: {
        equals: doc.id,
      },
    },
  })

  // files that rely on this folder
  await req.payload.delete({
    collection: relatedCollectionSlug,
    where: {
      parentFolder: {
        equals: doc.id,
      },
    },
  })
}
