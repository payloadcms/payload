import type { ClientSideEditViewProps, Document, InitPageResult, ServerProps } from 'payload'

import { DefaultEditView } from '@payloadcms/ui'
import { redirect } from 'next/navigation.js'
import React from 'react'

import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js'

type Props = {
  doc: Document
  initPageResult: InitPageResult
} & ClientSideEditViewProps &
  ServerProps
export const GlobalEditView = async (args: Props) => {
  const { initPageResult, payload, ...rest } = args
  const { slug } = args.initPageResult.collectionConfig
  const tenant = getTenantFromCookie(initPageResult.req.headers)

  if (tenant) {
    const { docs } = await payload.find({
      collection: slug,
      depth: 0,
      limit: 1,
      where: {
        tenant: {
          equals: tenant,
        },
      },
    })

    if (args?.doc?.id && !docs[0]?.id) {
      // viewing a document with an id but does not match the selected tenant, redirect to create route
      redirect(`${payload.config.routes.admin}/collections/${slug}/create`)
    } else if (docs[0]?.id && args?.doc?.id !== docs[0]?.id) {
      // tenant document already exists but does not match current route doc ID, redirect to matching tenant doc
      redirect(`${payload.config.routes.admin}/collections/${slug}/${docs[0]?.id}`)
    }
  }

  return (
    <DefaultEditView
      Description={rest.Description}
      PreviewButton={rest.PreviewButton}
      PublishButton={rest.PreviewButton}
      SaveButton={rest.PreviewButton}
      SaveDraftButton={rest.PreviewButton}
      Upload={rest.Upload}
    />
  )
}
