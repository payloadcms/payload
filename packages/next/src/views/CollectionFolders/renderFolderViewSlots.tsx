import type {
  AfterFolderListClientProps,
  AfterFolderListTableClientProps,
  AfterFolderListTableServerPropsOnly,
  BeforeFolderListClientProps,
  BeforeFolderListServerPropsOnly,
  BeforeFolderListTableClientProps,
  BeforeFolderListTableServerPropsOnly,
  FolderListViewServerPropsOnly,
  FolderListViewSlots,
  ListViewSlotSharedClientProps,
  Payload,
  SanitizedCollectionConfig,
  StaticDescription,
  ViewDescriptionClientProps,
  ViewDescriptionServerPropsOnly,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'

type Args = {
  clientProps: ListViewSlotSharedClientProps
  collectionConfig: SanitizedCollectionConfig
  description?: StaticDescription
  payload: Payload
  serverProps: FolderListViewServerPropsOnly
}

export const renderFolderViewSlots = ({
  clientProps,
  collectionConfig,
  description,
  payload,
  serverProps,
}: Args): FolderListViewSlots => {
  const result: FolderListViewSlots = {} as FolderListViewSlots

  const adminConfig = getAdminConfig()
  const adminCollectionComponents = adminConfig.collections?.[collectionConfig.slug] as any

  const afterList =
    adminCollectionComponents?.afterList || collectionConfig.admin.components?.afterList

  if (afterList) {
    result.AfterFolderList = RenderServerComponent({
      clientProps: clientProps satisfies AfterFolderListClientProps,
      Component: afterList,
      serverProps: serverProps satisfies AfterFolderListTableServerPropsOnly,
    })
  }

  const listMenuItems =
    adminCollectionComponents?.listMenuItems || collectionConfig.admin.components?.listMenuItems

  if (Array.isArray(listMenuItems)) {
    result.listMenuItems = [
      RenderServerComponent({
        clientProps,
        Component: listMenuItems,
        serverProps,
      }),
    ]
  }

  const afterListTable =
    adminCollectionComponents?.afterListTable || collectionConfig.admin.components?.afterListTable

  if (afterListTable) {
    result.AfterFolderListTable = RenderServerComponent({
      clientProps: clientProps satisfies AfterFolderListTableClientProps,
      Component: afterListTable,
      serverProps: serverProps satisfies AfterFolderListTableServerPropsOnly,
    })
  }

  const beforeList =
    adminCollectionComponents?.beforeList || collectionConfig.admin.components?.beforeList

  if (beforeList) {
    result.BeforeFolderList = RenderServerComponent({
      clientProps: clientProps satisfies BeforeFolderListClientProps,
      Component: beforeList,
      serverProps: serverProps satisfies BeforeFolderListServerPropsOnly,
    })
  }

  const beforeListTable =
    adminCollectionComponents?.beforeListTable || collectionConfig.admin.components?.beforeListTable

  if (beforeListTable) {
    result.BeforeFolderListTable = RenderServerComponent({
      clientProps: clientProps satisfies BeforeFolderListTableClientProps,
      Component: beforeListTable,
      serverProps: serverProps satisfies BeforeFolderListTableServerPropsOnly,
    })
  }

  const Description =
    adminCollectionComponents?.Description || collectionConfig.admin.components?.Description

  if (Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        collectionSlug: collectionConfig.slug,
        description,
      } satisfies ViewDescriptionClientProps,
      Component: Description,
      serverProps: serverProps satisfies ViewDescriptionServerPropsOnly,
    })
  }

  return result
}
