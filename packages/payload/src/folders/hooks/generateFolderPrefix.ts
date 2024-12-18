import type { CollectionSlug, Payload } from '../../index.js'
import type { FolderInterface } from '../types.js'

export async function generateFolderPrefix({
  folderCollectionSlug,
  parentFolder,
  payload,
}: {
  folderCollectionSlug: CollectionSlug
  parentFolder: FolderInterface | number | string
  payload: Payload
}) {
  if (parentFolder) {
    const parentFolderDoc: FolderInterface =
      typeof parentFolder === 'string' || typeof parentFolder === 'number'
        ? ((await payload.findByID({
            id: parentFolder,
            collection: folderCollectionSlug,
          })) as FolderInterface)
        : parentFolder

    return `${parentFolderDoc?.prefix ? `${parentFolderDoc.prefix}/` : ''}${parentFolderDoc.name}`
  }

  return null
}
