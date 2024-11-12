import type { ListViewSlots } from '@payloadcms/ui'
import type { Payload, SanitizedCollectionConfig, StaticDescription } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

export const renderListViewSlots = ({
  collectionConfig,
  description,
  payload,
}: {
  collectionConfig: SanitizedCollectionConfig
  description?: StaticDescription
  payload: Payload
}): ListViewSlots => {
  const result: ListViewSlots = {} as ListViewSlots

  if (collectionConfig.admin.components?.afterList) {
    result.AfterList = (
      <RenderServerComponent
        Component={collectionConfig.admin.components.afterList}
        importMap={payload.importMap}
      />
    )
  }

  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterListTable = (
      <RenderServerComponent
        Component={collectionConfig.admin.components.afterListTable}
        importMap={payload.importMap}
      />
    )
  }

  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeList = (
      <RenderServerComponent
        Component={collectionConfig.admin.components.beforeList}
        importMap={payload.importMap}
      />
    )
  }

  if (collectionConfig.admin.components?.beforeListTable) {
    result.BeforeListTable = (
      <RenderServerComponent
        Component={collectionConfig.admin.components.beforeListTable}
        importMap={payload.importMap}
      />
    )
  }

  if (collectionConfig.admin.components?.Description) {
    result.Description = (
      <RenderServerComponent
        clientProps={{
          description,
        }}
        Component={collectionConfig.admin.components.Description}
        importMap={payload.importMap}
      />
    )
  }

  return result
}
