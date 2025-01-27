import type {
  Document,
  EditViewComponent,
  OptionObject,
  PayloadServerReactComponent,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getClientSchemaMap } from '@payloadcms/ui/utilities/getClientSchemaMap'
import { getSchemaMap } from '@payloadcms/ui/utilities/getSchemaMap'
import { notFound } from 'next/navigation.js'
import React from 'react'

import type { DiffComponentProps } from './RenderFieldsToDiff/types.js'

import { getLatestVersion } from '../Versions/getLatestVersion.js'
import { buildVersionState } from './buildVersionState.js'
import { DefaultVersionView } from './Default/index.js'

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
          parentID: id,
          payload,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'collection',
          locale: 'all',
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
          payload,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'global',
          locale: 'all',
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
      })
    } else {
      comparisonDoc = await payload.findGlobalVersionByID({
        id: comparisonVersionIDFromParams,
        slug: globalSlug,
        depth: 0,
        locale: 'all',
      })
    }
  } else {
    comparisonDoc = latestVersion
  }

  /**
   * Handle custom diff field components
   */
  const customDiffComponents = (collectionConfig ?? globalConfig)?.admin?.components?.views?.edit
    ?.version?.diffComponents

  const customRenderedDiffComponents = {}
  if (customDiffComponents) {
    for (const [key, component] of Object.entries(customDiffComponents)) {
      customRenderedDiffComponents[key] = RenderServerComponent({
        clientProps: {} as DiffComponentProps,
        Component: component,
        importMap: payload.importMap,
        serverProps: {},
      })
    }
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

  const versionState = buildVersionState({
    clientSchemaMap,
    comparisonSiblingData: comparisonDoc?.version,
    customDiffComponents,
    entitySlug: collectionSlug || globalSlug,
    fieldPermissions: docPermissions?.fields,
    fields: (collectionConfig || globalConfig)?.fields,
    i18n,
    locales: selectedLocales && selectedLocales.map((locale) => locale.value),
    parentIndexPath: '',
    parentPath: '',
    parentSchemaPath: '',
    req,
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
      selectedLocales={selectedLocales}
      versionID={versionID}
      versionState={versionState}
    />
  )
}
