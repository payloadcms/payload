import type {
  AfterListClientProps,
  AfterListTableClientProps,
  AfterListTableServerPropsOnly,
  BeforeListClientProps,
  BeforeListServerPropsOnly,
  BeforeListTableClientProps,
  BeforeListTableServerPropsOnly,
  ListViewServerPropsOnly,
  ListViewSlotClientProps,
  ListViewSlots,
  Payload,
  SanitizedCollectionConfig,
  StaticDescription,
  ViewDescriptionClientProps,
  ViewDescriptionServerPropsOnly,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

type Args = {
  clientProps: ListViewSlotClientProps
  collectionConfig: SanitizedCollectionConfig
  description?: StaticDescription
  payload: Payload
  serverProps: ListViewServerPropsOnly
}

export const renderListViewSlots = ({
  clientProps: slotClientProps,
  collectionConfig,
  description,
  payload,
  serverProps,
}: Args): ListViewSlots => {
  const result: ListViewSlots = {} as ListViewSlots

  if (collectionConfig.admin.components?.afterList) {
    result.AfterList = RenderServerComponent({
      clientProps: slotClientProps satisfies AfterListClientProps,
      Component: collectionConfig.admin.components.afterList,
      importMap: payload.importMap,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterListTable = RenderServerComponent({
      clientProps: slotClientProps satisfies AfterListTableClientProps,
      Component: collectionConfig.admin.components.afterListTable,
      importMap: payload.importMap,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeList = RenderServerComponent({
      clientProps: slotClientProps satisfies BeforeListClientProps,
      Component: collectionConfig.admin.components.beforeList,
      importMap: payload.importMap,
      serverProps: serverProps satisfies BeforeListServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeListTable) {
    result.BeforeListTable = RenderServerComponent({
      clientProps: slotClientProps satisfies BeforeListTableClientProps,
      Component: collectionConfig.admin.components.beforeListTable,
      importMap: payload.importMap,
      serverProps: serverProps satisfies BeforeListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        description,
      } satisfies ViewDescriptionClientProps,
      Component: collectionConfig.admin.components.Description,
      importMap: payload.importMap,
      serverProps: serverProps satisfies ViewDescriptionServerPropsOnly,
    })
  }

  return result
}
