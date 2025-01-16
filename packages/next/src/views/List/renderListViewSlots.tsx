import type {
  ListComponentClientProps,
  ListComponentServerProps,
  ListViewSlots,
} from '@payloadcms/ui'
import type { Payload, SanitizedCollectionConfig, StaticDescription } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

type Args = {
  clientProps: ListComponentClientProps
  collectionConfig: SanitizedCollectionConfig
  description?: StaticDescription
  payload: Payload
  serverProps: ListComponentServerProps
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
      clientProps,
      Component: collectionConfig.admin.components.afterList,
      importMap: payload.importMap,
      serverProps,
    })
  }

  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterListTable = RenderServerComponent({
      clientProps,
      Component: collectionConfig.admin.components.afterListTable,
      importMap: payload.importMap,
      serverProps,
    })
  }

  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeList = RenderServerComponent({
      clientProps,
      Component: collectionConfig.admin.components.beforeList,
      importMap: payload.importMap,
      serverProps,
    })
  }

  if (collectionConfig.admin.components?.beforeListTable) {
    result.BeforeListTable = RenderServerComponent({
      clientProps,
      Component: collectionConfig.admin.components.beforeListTable,
      importMap: payload.importMap,
      serverProps,
    })
  }

  if (collectionConfig.admin.components?.Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        description,
        ...clientProps,
      },
      Component: collectionConfig.admin.components.Description,
      importMap: payload.importMap,
      serverProps,
    })
  }

  return result
}
