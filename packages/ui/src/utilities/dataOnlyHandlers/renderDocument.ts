import type { DocumentPreferences, ServerFunction, VisibleEntities } from 'payload'

import { canAccessAdmin, isEntityHidden } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'

import type { DocumentViewData } from '../../views/Document/getDocumentViewData.js'

import { RenderClientComponent } from '../../elements/RenderServerComponent/clientOnly.js'
import { getDocumentViewData } from '../../views/Document/getDocumentViewData.js'
import { getClientConfig } from '../getClientConfig.js'

export type RenderDocumentDataOnlyResult = {
  data: Record<string, unknown>
  documentViewData: DocumentViewData
  preferences?: DocumentPreferences
}

/**
 * Data-only alternative to `renderDocumentHandler` (packages/next).
 * Returns serializable `DocumentViewData` instead of `{ Document: ReactNode }`.
 */
export const renderDocumentDataOnlyHandler: ServerFunction<
  {
    collectionSlug: string
    disableActions?: boolean
    docID?: number | string
    drawerSlug?: string
    initialData?: Record<string, unknown>
    overrideEntityVisibility?: boolean
    paramsOverride?: { segments: string[] }
    redirectAfterCreate?: boolean
    redirectAfterDelete?: boolean
    redirectAfterDuplicate?: boolean
    searchParams?: Record<string, string | string[] | undefined>
    versions?: any
  },
  Promise<RenderDocumentDataOnlyResult>
> = async (args) => {
  const {
    collectionSlug,
    cookies,
    disableActions,
    docID,
    drawerSlug,
    initialData,
    locale,
    overrideEntityVisibility,
    paramsOverride,
    permissions,
    redirectAfterCreate,
    renderComponent,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    searchParams = {},
    versions,
  } = args

  await canAccessAdmin({ req })

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: req.payload.importMap,
    user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  let preferences: DocumentPreferences | undefined

  if (docID) {
    const preferencesKey = `${collectionSlug}-edit-${docID}`

    preferences = await payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        where: {
          and: [
            { key: { equals: preferencesKey } },
            { 'user.relationTo': { equals: user.collection } },
            { 'user.value': { equals: user.id } },
          ],
        },
      })
      .then((res) => res.docs[0]?.value as DocumentPreferences)
  }

  const visibleEntities: VisibleEntities = {
    collections: payload.config.collections
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
    globals: payload.config.globals
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
  }

  const documentViewData = await getDocumentViewData({
    collectionConfig: payload?.collections?.[collectionSlug]?.config,
    cookies,
    defaultViews: { edit: null, version: null, versions: null },
    disableActions,
    docID,
    drawerSlug,
    globalConfig: config.globals.find((global) => global.slug === collectionSlug),
    initialData,
    locale,
    overrideEntityVisibility,
    params: paramsOverride ?? {
      segments: ['collections', collectionSlug, String(docID)],
    },
    permissions,
    redirectAfterCreate,
    renderComponent: renderComponent || RenderClientComponent,
    req,
    searchParams,
    versions,
    viewType: 'document',
    visibleEntities,
  })

  return {
    data: documentViewData.doc,
    documentViewData,
    preferences,
  }
}
