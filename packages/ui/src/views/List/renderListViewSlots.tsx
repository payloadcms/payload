import type {
  AfterListClientProps,
  AfterListTableClientProps,
  AfterListTableServerPropsOnly,
  BeforeListClientProps,
  BeforeListServerPropsOnly,
  BeforeListTableClientProps,
  BeforeListTableServerPropsOnly,
  ComponentRenderer,
  ListViewServerPropsOnly,
  ListViewSlots,
  ListViewSlotSharedClientProps,
  Payload,
  SanitizedCollectionConfig,
  StaticDescription,
  ViewDescriptionClientProps,
  ViewDescriptionServerPropsOnly,
} from 'payload'

import React from 'react'

import { Banner } from '../../elements/Banner/index.js'
import { RenderClientComponent } from '../../elements/RenderServerComponent/clientOnly.js'

type Args = {
  clientProps: ListViewSlotSharedClientProps
  collectionConfig: SanitizedCollectionConfig
  description?: StaticDescription
  notFoundDocId?: null | string
  payload: Payload
  renderComponent?: ComponentRenderer
  serverProps: ListViewServerPropsOnly
}

export const renderListViewSlots = ({
  clientProps,
  collectionConfig,
  description,
  notFoundDocId,
  payload,
  renderComponent,
  serverProps,
}: Args): ListViewSlots => {
  const render: ComponentRenderer = renderComponent || RenderClientComponent
  const result: ListViewSlots = {} as ListViewSlots

  if (collectionConfig.admin.components?.afterList) {
    result.AfterList = render({
      clientProps: clientProps satisfies AfterListClientProps,
      Component: collectionConfig.admin.components.afterList,
      importMap: payload.importMap,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  const listMenuItems = collectionConfig.admin.components?.listMenuItems

  if (Array.isArray(listMenuItems)) {
    result.listMenuItems = [
      render({
        clientProps,
        Component: listMenuItems,
        importMap: payload.importMap,
        serverProps,
      }),
    ]
  }

  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterListTable = render({
      clientProps: clientProps satisfies AfterListTableClientProps,
      Component: collectionConfig.admin.components.afterListTable,
      importMap: payload.importMap,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeList = render({
      clientProps: clientProps satisfies BeforeListClientProps,
      Component: collectionConfig.admin.components.beforeList,
      importMap: payload.importMap,
      serverProps: serverProps satisfies BeforeListServerPropsOnly,
    })
  }

  // Handle beforeListTable with optional banner
  const existingBeforeListTable = collectionConfig.admin.components?.beforeListTable
    ? render({
        clientProps: clientProps satisfies BeforeListTableClientProps,
        Component: collectionConfig.admin.components.beforeListTable,
        importMap: payload.importMap,
        serverProps: serverProps satisfies BeforeListTableServerPropsOnly,
      })
    : null

  // Create banner for document not found
  const notFoundBanner = notFoundDocId ? (
    <Banner className="list-view__not-found-banner" type="danger">
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
    result.Description = render({
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
