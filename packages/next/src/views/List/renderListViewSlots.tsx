import type {
  AfterListClientProps,
  AfterListTableClientProps,
  AfterListTableServerPropsOnly,
  BeforeListClientProps,
  BeforeListServerPropsOnly,
  BeforeListTableClientProps,
  BeforeListTableServerPropsOnly,
  ListSelectionItemsClientProps,
  ListSelectionItemsServerPropsOnly,
  ListViewServerPropsOnly,
  ListViewSlots,
  ListViewSlotSharedClientProps,
  Payload,
  SanitizedCollectionConfig,
  StaticDescription,
  ViewDescriptionClientProps,
  ViewDescriptionServerPropsOnly,
} from 'payload'

import { Banner } from '@payloadcms/ui/elements/Banner'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

type Args = {
  clientProps: ListViewSlotSharedClientProps
  collectionConfig: SanitizedCollectionConfig
  description?: StaticDescription
  notFoundDocId?: null | string
  payload: Payload
  serverProps: ListViewServerPropsOnly
}

export const renderListViewSlots = ({
  clientProps,
  collectionConfig,
  description,
  notFoundDocId,
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

  const listMenuItems = collectionConfig.admin.components?.listMenuItems

  if (Array.isArray(listMenuItems)) {
    result.listMenuItems = [
      RenderServerComponent({
        clientProps,
        Component: listMenuItems,
        importMap: payload.importMap,
        serverProps,
      }),
    ]
  }

  const listSelectionItems = collectionConfig.admin.components?.listSelectionItems

  if (Array.isArray(listSelectionItems)) {
    result.listSelectionItems = [
      RenderServerComponent({
        clientProps: clientProps satisfies ListSelectionItemsClientProps,
        Component: listSelectionItems,
        importMap: payload.importMap,
        serverProps: serverProps satisfies ListSelectionItemsServerPropsOnly,
      }),
    ]
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

  // Handle beforeListTable with optional banner
  const existingBeforeListTable = collectionConfig.admin.components?.beforeListTable
    ? RenderServerComponent({
        clientProps: clientProps satisfies BeforeListTableClientProps,
        Component: collectionConfig.admin.components.beforeListTable,
        importMap: payload.importMap,
        serverProps: serverProps satisfies BeforeListTableServerPropsOnly,
      })
    : null

  // Create banner for document not found
  const notFoundBanner = notFoundDocId ? (
    <Banner type="error">
      {serverProps.i18n.t('error:documentNotFound', { id: notFoundDocId })}
    </Banner>
  ) : null

  // Combine banner and existing component
  if (notFoundBanner || existingBeforeListTable) {
    result.BeforeListTable = (
      <React.Fragment>
        {notFoundBanner}
        {existingBeforeListTable}
      </React.Fragment>
    )
  }

  if (collectionConfig.admin.components?.Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        collectionSlug: collectionConfig.slug,
        description,
      } satisfies ViewDescriptionClientProps,
      Component: collectionConfig.admin.components.Description,
      importMap: payload.importMap,
      serverProps: serverProps satisfies ViewDescriptionServerPropsOnly,
    })
  }

  return result
}
