import type { Option } from '@payloadcms/ui'
import type { CollectionPermission, GlobalPermission } from 'payload/auth'
import type { Document, ServerSideEditViewProps } from 'payload/types'

import { notFound } from 'next/navigation.js'
import React from 'react'

import { DefaultVersionView } from './Default/index.js'

export const VersionView: React.FC = async (props: ServerSideEditViewProps) => {
  const { initPageResult, routeSegments } = props

  const {
    collectionConfig,
    docID: id,
    globalConfig,
    permissions,
    req: { payload, payload: { config } = {} } = {},
  } = initPageResult

  // /entityType/:entitySlug/:id/versions/:versionID
  const [entityType, entitySlug, docID, versions, versionID] = routeSegments

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const { localization } = config

  let docPermissions: CollectionPermission | GlobalPermission
  let slug: string

  let doc: Document
  let publishedDoc: Document
  let mostRecentDoc: Document

  if (collectionSlug) {
    slug = collectionSlug
    docPermissions = permissions.collections[collectionSlug]

    try {
      doc = await payload.findVersionByID({
        id: versionID,
        collection: slug,
        depth: 1,
        locale: '*',
      })

      publishedDoc = await payload.findByID({
        id,
        collection: slug,
        depth: 1,
        draft: false,
        locale: '*',
      })

      mostRecentDoc = await payload.findByID({
        id,
        collection: slug,
        depth: 1,
        draft: true,
        locale: '*',
      })
    } catch (error) {
      return notFound()
    }
  }

  if (globalSlug) {
    slug = globalSlug
    docPermissions = permissions.globals[globalSlug]

    try {
      doc = payload.findGlobalVersionByID({
        id: versionID,
        slug,
        depth: 1,
        locale: '*',
      })

      publishedDoc = payload.findGlobal({
        slug,
        depth: 1,
        draft: false,
        locale: '*',
      })

      mostRecentDoc = payload.findGlobal({
        slug,
        depth: 1,
        draft: true,
        locale: '*',
      })
    } catch (error) {
      return notFound()
    }
  }

  const localeOptions: Option[] =
    localization &&
    localization?.locales &&
    localization.locales.map(({ code, label }) => ({
      label: typeof label === 'string' ? label : '',
      value: code,
    }))

  if (!doc) {
    return notFound()
  }

  return (
    <DefaultVersionView
      doc={doc}
      docPermissions={docPermissions}
      initialComparisonDoc={mostRecentDoc}
      localeOptions={localeOptions}
      mostRecentDoc={mostRecentDoc}
      publishedDoc={publishedDoc}
      versionID={versionID}
    />
  )
}
