import type { CollectionSlug, ServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { FolderInterface } from '../types.js'

import { FolderProvider } from '../../../providers/Folders/index.js'
import { buildBreadCrumbs } from '../utilities/buildBreadcrumbs.js'
import { getSubFolders } from '../utilities/getSubfolders.js'
import { Subfolders } from './index.client.js'

type FolderItemsProps = {
  collectionSlug: CollectionSlug
  folderSlug: string
} & ServerProps
export const Folders = async (args: FolderItemsProps) => {
  const parentFolderID =
    typeof args.searchParams?.folderID === 'string' ? args.searchParams.folderID : null

  let breadcrumbs = []
  let subfolders = []
  try {
    subfolders = await getSubFolders({
      collectionSlug: args.collectionSlug,
      folderCollectionSlug: args.folderSlug,
      folderID: parentFolderID,
      payload: args.payload,
      user: args.user,
    })

    if (parentFolderID) {
      // find folder with depth of 100 to get all parent folders
      const folderDoc = (await args.payload.findByID({
        id: parentFolderID,
        collection: args.folderSlug,
        depth: 100,
        overrideAccess: false,
        user: args.user,
      })) as FolderInterface

      breadcrumbs = folderDoc ? buildBreadCrumbs([], folderDoc).reverse() : []
    }
  } catch (error) {
    console.error('Error getting subfolders:', error)
  }

  const collectionLabel = getTranslation(
    args.payload.collections[args.collectionSlug].config.labels.singular,
    args.i18n,
  )
  breadcrumbs.unshift({
    id: undefined,
    name: typeof collectionLabel === 'string' ? collectionLabel : args.collectionSlug,
  })

  return (
    <FolderProvider
      collectionSlug={args.collectionSlug}
      folderCollectionSlug={args.folderSlug}
      initialData={{
        breadcrumbs,
        docs: [],
        folderID: parentFolderID,
        subfolders,
      }}
    >
      <Subfolders collectionSlug={args.collectionSlug} />
    </FolderProvider>
  )
}
