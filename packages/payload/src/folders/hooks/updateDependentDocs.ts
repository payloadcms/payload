import type { CollectionAfterChangeHook, CollectionSlug } from '../../index.js'
import type { FolderInterface } from '../types.js'

export const updateDependentDocs = async ({
  collection,
  doc,
  previousDoc,
  relatedCollectionSlug,
  req,
}: {
  relatedCollectionSlug: CollectionSlug
} & Parameters<CollectionAfterChangeHook>[0]) => {
  const prefixChanged =
    previousDoc.parentFolder !== doc.parentFolder ||
    previousDoc.name !== doc.name ||
    previousDoc.prefix !== doc.prefix

  if (prefixChanged) {
    const childDocPrefix = `${doc.prefix ? `${doc.prefix}/` : ''}${doc.name}`

    // folders that rely on this folder
    await req.payload.update({
      collection: collection.slug,
      data: {
        prefix: childDocPrefix,
      } as Partial<FolderInterface>,
      where: {
        parentFolder: {
          equals: doc.id,
        },
      },
    })

    // files that rely on this folder
    await req.payload.update({
      collection: relatedCollectionSlug,
      data: {
        prefix: childDocPrefix,
      } as any,
      where: {
        parentFolder: {
          equals: doc.id,
        },
      },
    })
  }

  return doc
}
