import type {
  CollectionPermission,
  Document,
  EditViewComponent,
  GlobalPermission,
  OptionObject,
} from 'payload'

import { notFound } from 'next/navigation.js'
import React from 'react'

import { DefaultVersionView } from './Default/index.js'

export const VersionView: EditViewComponent = async (props) => {
  const { initPageResult, routeSegments } = props

  const {
    collectionConfig,
    docID: id,
    globalConfig,
    permissions,
    req: { payload, payload: { config } = {}, user } = {},
  } = initPageResult

  const versionID = routeSegments[routeSegments.length - 1]

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const { localization } = config

  let docPermissions: CollectionPermission | GlobalPermission
  let slug: string

  let doc: Document
  let publishedDoc: Document
  let mostRecentDoc: Document

  if (collectionSlug) {
    // /collections/:slug/:id/versions/:versionID
    slug = collectionSlug
    docPermissions = permissions.collections[collectionSlug]

    try {
      doc = await payload.findVersionByID({
        id: versionID,
        collection: slug,
        depth: 1,
        locale: '*',
        overrideAccess: false,
        user,
      })

      publishedDoc = await payload.findByID({
        id,
        collection: slug,
        depth: 1,
        draft: false,
        locale: '*',
        overrideAccess: false,
        user,
      })

      mostRecentDoc = await payload.findByID({
        id,
        collection: slug,
        depth: 1,
        draft: true,
        locale: '*',
        overrideAccess: false,
        user,
      })
    } catch (error) {
      return notFound()
    }
  }

  if (globalSlug) {
    // /globals/:slug/versions/:versionID
    slug = globalSlug
    docPermissions = permissions.globals[globalSlug]

    try {
      doc = await payload.findGlobalVersionByID({
        id: versionID,
        slug,
        depth: 1,
        locale: '*',
        overrideAccess: false,
        user,
      })

      publishedDoc = await payload.findGlobal({
        slug,
        depth: 1,
        draft: false,
        locale: '*',
        overrideAccess: false,
        user,
      })

      mostRecentDoc = await payload.findGlobal({
        slug,
        depth: 1,
        draft: true,
        locale: '*',
        overrideAccess: false,
        user,
      })
    } catch (error) {
      return notFound()
    }
  }

  const localeOptions: OptionObject[] =
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
