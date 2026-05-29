import type { DocumentPreferences, VisibleEntities } from 'payload'

import { canAccessAdmin, isEntityHidden } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'

import type { RenderDocumentServerFunction } from '../../providers/ServerFunctions/index.js'

import { renderDocument } from '../../views/Document/DocumentViewRSC.js'
import { getClientConfig } from '../getClientConfig.js'

/**
 * Framework-agnostic `'render-document'` server function. Used by document
 * drawers and other on-demand document-render flows in both adapters.
 * Returns `{ data, Document, preferences }` where `Document` is a React node;
 * adapters ship it to the client either via Next's RSC payload or, for
 * TanStack Start, via `serializeForRsc` + `createServerFn`.
 *
 * Throws `Error('not-found')` and `Error('redirect:<url>')` per the contract
 * documented on `renderDocument`. Adapters translate those into framework-
 * specific responses.
 */
export const renderDocumentHandler: RenderDocumentServerFunction = async (args) => {
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
    redirectAfterDelete,
    redirectAfterDuplicate,
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

  let preferences: DocumentPreferences

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

  const { data, Document } = await renderDocument({
    clientConfig,
    disableActions,
    documentSubViewType: 'default',
    drawerSlug,
    i18n,
    importMap: payload.importMap,
    initialData,
    initPageResult: {
      collectionConfig: payload?.collections?.[collectionSlug]?.config,
      cookies,
      docID,
      globalConfig: payload.config.globals.find((global) => global.slug === collectionSlug),
      languageOptions: undefined,
      locale,
      permissions,
      req,
      translations: undefined,
      visibleEntities,
    },
    locale,
    overrideEntityVisibility,
    params: paramsOverride ?? {
      segments: ['collections', collectionSlug, String(docID)],
    },
    payload,
    permissions,
    redirectAfterCreate,
    redirectAfterDelete,
    redirectAfterDuplicate,
    searchParams,
    server: req.server,
    versions,
    viewType: 'document',
  })

  return {
    data,
    Document,
    preferences,
  }
}
