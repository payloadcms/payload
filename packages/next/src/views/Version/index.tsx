import type {
  CollectionPermission,
  Document,
  EditViewComponent,
  GlobalPermission,
  OptionObject,
  PayloadServerReactComponent,
} from 'payload'

import { notFound } from 'next/navigation.js'
import { deepCopyObjectSimple } from 'payload'
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

  let docPermissions: CollectionPermission | GlobalPermission
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
          payload,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'collection',
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
      /**
       * After bumping the Next.js canary to 104, and React to 19.0.0-rc-06d0b89e-20240801" we have to deepCopy the permissions object (https://github.com/payloadcms/payload/pull/7541).
       * If both HydrateClientUser and RenderCustomComponent receive the same permissions object (same object reference), we get a
       * "TypeError: Cannot read properties of undefined (reading '$$typeof')" error
       *
       * // TODO: Revisit this in the future and figure out why this is happening. Might be a React/Next.js bug. We don't know why it happens, and a future React/Next version might unbreak this (keep an eye on this and remove deepCopyObjectSimple if that's the case)
       */
      docPermissions={deepCopyObjectSimple(docPermissions)}
      initialComparisonDoc={latestVersion}
      latestDraftVersion={latestDraftVersion?.id}
      latestPublishedVersion={latestPublishedVersion?.id}
      localeOptions={localeOptions}
      versionID={versionID}
    />
  )
}
