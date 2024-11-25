import type {
  Document,
  EditViewComponent,
  OptionObject,
  PayloadServerReactComponent,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import { notFound } from 'next/navigation.js'
import React from 'react'

import { getLatestVersion } from '../Versions/getLatestVersion.js'
import { DefaultVersionView } from './Default/index.js'

export const VersionView: PayloadServerReactComponent<EditViewComponent> = async (props) => {
  const { initPageResult, routeSegments } = props

  const {
    collectionConfig,
    docID: id,
    globalConfig,
    permissions,
    req,
    req: { payload, payload: { config } = {}, user } = {},
  } = initPageResult

  const versionID = routeSegments[routeSegments.length - 1]

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const { localization } = config

  let docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  let slug: string

  let doc: Document
  let latestPublishedVersion = null
  let latestDraftVersion = null

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
        req,
        user,
      })

      if (collectionConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug,
          type: 'collection',
          parentID: id,
          payload,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'collection',
          parentID: id,
          payload,
          status: 'published',
        })
      }
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
        req,
        user,
      })

      if (globalConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug,
          type: 'global',
          payload,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'global',
          payload,
          status: 'published',
        })
      }
    } catch (error) {
      return notFound()
    }
  }

  const publishedNewerThanDraft = latestPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt

  if (publishedNewerThanDraft) {
    latestDraftVersion = {
      id: '',
      updatedAt: '',
    }
  }

  const localeOptions: OptionObject[] =
    localization &&
    localization.locales.map(({ code, label }) => ({
      label,
      value: code,
    }))

  const latestVersion =
    latestPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt
      ? latestPublishedVersion
      : latestDraftVersion

  if (!doc) {
    return notFound()
  }

  return (
    <DefaultVersionView
      doc={doc}
      docPermissions={docPermissions}
      initialComparisonDoc={latestVersion}
      latestDraftVersion={latestDraftVersion?.id}
      latestPublishedVersion={latestPublishedVersion?.id}
      localeOptions={localeOptions}
      versionID={versionID}
    />
  )
}
