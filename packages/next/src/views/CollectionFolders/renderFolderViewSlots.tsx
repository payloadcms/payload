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

  if (collectionConfig.admin.components?.afterList) {
    result.AfterFolderList = RenderServerComponent({
      clientProps: clientProps satisfies AfterFolderListClientProps,
      Component: collectionConfig.admin.components.afterList,
      serverProps: serverProps satisfies AfterFolderListTableServerPropsOnly,
    })
  }

  const listMenuItems = collectionConfig.admin.components?.listMenuItems
  if (Array.isArray(listMenuItems)) {
    result.listMenuItems = [
      RenderServerComponent({
        clientProps,
        Component: listMenuItems,
        serverProps,
      }),
    ]
  }

  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterFolderListTable = RenderServerComponent({
      clientProps: clientProps satisfies AfterFolderListTableClientProps,
      Component: collectionConfig.admin.components.afterListTable,
      serverProps: serverProps satisfies AfterFolderListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeFolderList = RenderServerComponent({
      clientProps: clientProps satisfies BeforeFolderListClientProps,
      Component: collectionConfig.admin.components.beforeList,
      serverProps: serverProps satisfies BeforeFolderListServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeListTable) {
    result.BeforeFolderListTable = RenderServerComponent({
      clientProps: clientProps satisfies BeforeFolderListTableClientProps,
      Component: collectionConfig.admin.components.beforeListTable,
      serverProps: serverProps satisfies BeforeFolderListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        collectionSlug: collectionConfig.slug,
        description,
      } satisfies ViewDescriptionClientProps,
      Component: collectionConfig.admin.components.Description,
      serverProps: serverProps satisfies ViewDescriptionServerPropsOnly,
    })
  }

  return result
}
