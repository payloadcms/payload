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
  try {
    await req.payload.delete({
      collection: collection.slug,
      req,
      where: {
        parentFolder: {
          equals: doc.id,
        },
      },
    })
  } catch (error) {
    console.error('Error deleting dependent folders:', error)
  }
  // files that rely on this folder
  try {
    await req.payload.delete({
      collection: relatedCollectionSlug,
      req,
      where: {
        parentFolder: {
          equals: doc.id,
        },
      },
    })
  } catch (error) {
    console.error('Error deleting dependent files:', error)
  }
}
