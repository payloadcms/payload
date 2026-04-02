import type {
  AfterListClientProps,
  AfterListTableClientProps,
  AfterListTableServerPropsOnly,
  BeforeListClientProps,
  BeforeListServerPropsOnly,
  BeforeListTableClientProps,
  BeforeListTableServerPropsOnly,
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

import type { WithViewRenderer } from '../../utilities/createViewRenderer.js'

import { Banner } from '../../elements/Banner/index.js'
import { createViewRenderer } from '../../utilities/createViewRenderer.js'

type Args = {
  clientProps: ListViewSlotSharedClientProps
  collectionConfig: SanitizedCollectionConfig
  description?: StaticDescription
  notFoundDocId?: null | string
  payload: Payload
  serverProps: ListViewServerPropsOnly
  viewRenderer?: WithViewRenderer['viewRenderer']
}

export const renderListViewSlots = ({
  clientProps,
  collectionConfig,
  description,
  notFoundDocId,
  payload,
  serverProps,
  viewRenderer,
}: Args): ListViewSlots => {
  const result: ListViewSlots = {} as ListViewSlots
  const renderView = viewRenderer ?? createViewRenderer({ importMap: payload.importMap })

  if (collectionConfig.admin.components?.afterList) {
    result.AfterList = renderView({
      clientProps: clientProps satisfies AfterListClientProps,
      Component: collectionConfig.admin.components.afterList,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  const listMenuItems = collectionConfig.admin.components?.listMenuItems

  if (Array.isArray(listMenuItems)) {
    result.listMenuItems = [
      renderView({
        clientProps,
        Component: listMenuItems,
        serverProps,
      }),
    ]
  }

  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterListTable = renderView({
      clientProps: clientProps satisfies AfterListTableClientProps,
      Component: collectionConfig.admin.components.afterListTable,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeList = renderView({
      clientProps: clientProps satisfies BeforeListClientProps,
      Component: collectionConfig.admin.components.beforeList,
      serverProps: serverProps satisfies BeforeListServerPropsOnly,
    })
  }

  // Handle beforeListTable with optional banner
  const existingBeforeListTable = collectionConfig.admin.components?.beforeListTable
    ? renderView({
        clientProps: clientProps satisfies BeforeListTableClientProps,
        Component: collectionConfig.admin.components.beforeListTable,
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
    result.Description = renderView({
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
