import type {
  Document,
  EditViewComponent,
  OptionObject,
  PayloadServerReactComponent,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getClientSchemaMap } from '@payloadcms/ui/utilities/getClientSchemaMap'
import { getSchemaMap } from '@payloadcms/ui/utilities/getSchemaMap'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { getLatestVersion } from '../Versions/getLatestVersion.js'
import { DefaultVersionView } from './Default/index.js'
import { RenderDiff } from './RenderFieldsToDiff/index.js'

export const VersionView: PayloadServerReactComponent<EditViewComponent> = async (props) => {
  const { i18n, initPageResult, routeSegments, searchParams } = props

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

  const localeCodesFromParams = searchParams.localeCodes
    ? JSON.parse(searchParams.localeCodes as string)
    : null
  const comparisonVersionIDFromParams: string = searchParams.compareValue as string

  const modifiedOnly: boolean = searchParams.modifiedOnly === 'true'

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
        depth: 0,
        locale: 'all',
        overrideAccess: false,
        req,
        user,
      })

      if (collectionConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug,
          type: 'collection',
          locale: 'all',
          overrideAccess: false,
          parentID: id,
          payload,
          req,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'collection',
          locale: 'all',
          overrideAccess: false,
          parentID: id,
          payload,
          req,
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
        depth: 0,
        locale: 'all',
        overrideAccess: false,
        req,
        user,
      })

      if (globalConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug,
          type: 'global',
          locale: 'all',
          overrideAccess: false,
          payload,
          req,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'global',
          locale: 'all',
          overrideAccess: false,
          payload,
          req,
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

  const selectedLocales: OptionObject[] = []
  if (localization) {
    if (localeCodesFromParams) {
      for (const code of localeCodesFromParams) {
        const locale = localization.locales.find((locale) => locale.code === code)
        if (locale) {
          selectedLocales.push({
            label: locale.label,
            value: locale.code,
          })
        }
      }
    } else {
      for (const { code, label } of localization.locales) {
        selectedLocales.push({
          label,
          value: code,
        })
      }
    }
  }

  const latestVersion =
    latestPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt
      ? latestPublishedVersion
      : latestDraftVersion

  if (!doc) {
    return notFound()
  }

  /**
   * The doc to compare this version to is either the latest version, or a specific version if specified in the URL.
   * This specific version is added to the URL when a user selects a version to compare to.
   */
  let comparisonDoc = null
  if (comparisonVersionIDFromParams) {
    if (collectionSlug) {
      comparisonDoc = await payload.findVersionByID({
        id: comparisonVersionIDFromParams,
        collection: collectionSlug,
        depth: 0,
        locale: 'all',
        overrideAccess: false,
        req,
      })
    } else {
      comparisonDoc = await payload.findGlobalVersionByID({
        id: comparisonVersionIDFromParams,
        slug: globalSlug,
        depth: 0,
        locale: 'all',
        overrideAccess: false,
        req,
      })
    }
  } else {
    comparisonDoc = latestVersion
  }

  const schemaMap = getSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n,
  })

  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: getClientConfig({ config: payload.config, i18n, importMap: payload.importMap }),
    globalSlug,
    i18n,
    payload,
    schemaMap,
  })

  const RenderedDiff = RenderDiff({
    clientSchemaMap,
    comparisonSiblingData: comparisonDoc?.version,
    customDiffComponents: {},
    entitySlug: collectionSlug || globalSlug,
    fieldPermissions: docPermissions?.fields,
    fields: (collectionConfig || globalConfig)?.fields,
    i18n,
    modifiedOnly,
    parentIndexPath: '',
    parentPath: '',
    parentSchemaPath: '',
    req,
    selectedLocales: selectedLocales && selectedLocales.map((locale) => locale.value),
    versionSiblingData: globalConfig
      ? {
          ...doc?.version,
          createdAt: doc?.version?.createdAt || doc.createdAt,
          updatedAt: doc?.version?.updatedAt || doc.updatedAt,
        }
      : doc?.version,
  })

  return (
    <DefaultVersionView
      canUpdate={docPermissions?.update}
      doc={doc}
      latestDraftVersion={latestDraftVersion?.id}
      latestPublishedVersion={latestPublishedVersion?.id}
      modifiedOnly={modifiedOnly}
      RenderedDiff={RenderedDiff}
      selectedLocales={selectedLocales}
      versionID={versionID}
    />
  )
}
