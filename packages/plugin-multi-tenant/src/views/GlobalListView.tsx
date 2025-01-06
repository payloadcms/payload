import type { ListViewClientProps } from '@payloadcms/ui'
import type { CollectionSlug, ServerProps } from 'payload'

import { DefaultListView } from '@payloadcms/ui'
import { redirect } from 'next/navigation.js'
import { createLocalReq } from 'payload'
import React from 'react'

import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Props = {
  collectionSlug: CollectionSlug
} & ListViewClientProps &
  ServerProps
export const GlobalListView = async (args: Props) => {
  const { collectionSlug, locale, payload, user, ...rest } = args
  const req = await createLocalReq({ locale: locale?.code, user }, payload)
  const tenant = getTenantFromCookie(req)

  if (tenant) {
    const { docs } = await payload.find({
      collection: collectionSlug,
      depth: 0,
      limit: 1,
      where: {
        tenant: {
          equals: tenant,
        },
      },
    })

    if (docs.length) {
      // tenant document exists, redirect to edit view
      redirect(`${payload.config.routes.admin}/collections/${collectionSlug}/${docs[0].id}`)
    } else {
      // tenant document does not exist, redirect to create route
      redirect(`${payload.config.routes.admin}/collections/${collectionSlug}/create`)
    }
  }

  return (
    <DefaultListView
      AfterList={rest.AfterList}
      AfterListTable={rest.AfterListTable}
      beforeActions={rest.beforeActions}
      BeforeList={rest.AfterListTable}
      BeforeListTable={rest.BeforeListTable}
      collectionSlug={collectionSlug}
      columnState={rest.columnState}
      Description={rest.BeforeListTable}
      disableBulkDelete={rest.disableBulkDelete}
      disableBulkEdit={rest.disableBulkDelete}
      enableRowSelections={rest.enableRowSelections}
      hasCreatePermission={rest.hasCreatePermission}
      listPreferences={rest.listPreferences}
      newDocumentURL={rest.newDocumentURL}
      preferenceKey={rest.preferenceKey}
      renderedFilters={rest.renderedFilters}
      Table={rest.Table}
    />
  )
}
