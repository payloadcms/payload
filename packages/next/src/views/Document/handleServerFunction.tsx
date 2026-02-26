import type { RenderDocumentServerFunction } from '@payloadcms/ui'
import type { DocumentPreferences, VisibleEntities } from 'payload'

import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { canAccessAdmin, isEntityHidden } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'

import { renderDocument } from './index.js'

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
            {
              key: {
                equals: preferencesKey,
              },
            },
            {
              'user.relationTo': {
                equals: user.collection,
              },
            },
            {
              'user.value': {
                equals: user.id,
              },
            },
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
    initialData,
    initPageResult: {
      collectionConfig: payload?.collections?.[collectionSlug]?.config,
      cookies,
      docID,
      globalConfig: payload.config.globals.find((global) => global.slug === collectionSlug),
      languageOptions: undefined, // TODO
      locale,
      permissions,
      req,
      translations: undefined, // TODO
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
    versions,
    viewType: 'document',
  })

  return {
    data,
    Document,
    preferences,
  }
}
