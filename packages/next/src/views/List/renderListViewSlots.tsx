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

import { Banner } from '@payloadcms/ui/elements/Banner'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'

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

  const adminConfig = getAdminConfig()
  const adminCollectionComponents = adminConfig.collections?.[collectionConfig.slug] as any

  const afterList =
    adminCollectionComponents?.afterList || collectionConfig.admin.components?.afterList

  if (afterList) {
    result.AfterList = RenderServerComponent({
      clientProps: clientProps satisfies AfterListClientProps,
      Component: afterList,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
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
    result.AfterListTable = RenderServerComponent({
      clientProps: clientProps satisfies AfterListTableClientProps,
      Component: afterListTable,
      serverProps: serverProps satisfies AfterListTableServerPropsOnly,
    })
  }

  const beforeList =
    adminCollectionComponents?.beforeList || collectionConfig.admin.components?.beforeList

  if (beforeList) {
    result.BeforeList = RenderServerComponent({
      clientProps: clientProps satisfies BeforeListClientProps,
      Component: beforeList,
      serverProps: serverProps satisfies BeforeListServerPropsOnly,
    })
  }

  // Handle beforeListTable with optional banner
  const beforeListTable =
    adminCollectionComponents?.beforeListTable || collectionConfig.admin.components?.beforeListTable

  const existingBeforeListTable = beforeListTable
    ? RenderServerComponent({
        clientProps: clientProps satisfies BeforeListTableClientProps,
        Component: beforeListTable,
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
