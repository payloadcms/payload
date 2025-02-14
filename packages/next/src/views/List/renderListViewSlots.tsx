import type {
  AfterListClientProps,
  AfterListTableClientProps,
  AfterListTableServerPropsOnly,
  BeforeListClientProps,
  BeforeListServerPropsOnly,
  BeforeListTableClientProps,
  BeforeListTableServerPropsOnly,
  ListDescriptionClientProps,
  ListDescriptionServerPropsOnly,
  ListViewServerPropsOnly,
  ListViewSlotClientProps,
  ListViewSlots,
  Payload,
  SanitizedCollectionConfig,
  StaticDescription,
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
  clientProps,
  collectionConfig,
  description,
  payload,
  serverProps,
}: Args): ListViewSlots => {
  const result: ListViewSlots = {} as ListViewSlots

  if (collectionConfig.admin.components?.afterList) {
    result.AfterList = RenderServerComponent({
      clientProps: clientProps satisfies AfterListClientProps,
      Component: collectionConfig.admin.components.afterList,
      importMap: payload.importMap,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterListTable = RenderServerComponent({
      clientProps: clientProps satisfies AfterListTableClientProps,
      Component: collectionConfig.admin.components.afterListTable,
      importMap: payload.importMap,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeList = RenderServerComponent({
      clientProps: clientProps satisfies BeforeListClientProps,
      Component: collectionConfig.admin.components.beforeList,
      importMap: payload.importMap,
      serverProps: serverProps satisfies BeforeListServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeListTable) {
    result.BeforeListTable = RenderServerComponent({
      clientProps: clientProps satisfies BeforeListTableClientProps,
      Component: collectionConfig.admin.components.beforeListTable,
      importMap: payload.importMap,
      serverProps: serverProps satisfies BeforeListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        description,
        ...clientProps,
      } satisfies ListDescriptionClientProps,
      Component: collectionConfig.admin.components.Description,
      importMap: payload.importMap,
      serverProps: serverProps satisfies ListDescriptionServerPropsOnly,
    })
  }

  return result
}
