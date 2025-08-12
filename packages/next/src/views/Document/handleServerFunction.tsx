import type { RenderDocumentServerFunction } from '@payloadcms/ui'
import type { DocumentPreferences, VisibleEntities } from 'payload'

import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { headers as getHeaders } from 'next/headers.js'
import { getAccessResults, isEntityHidden, parseCookies } from 'payload'

import { renderDocument } from './index.js'

export const renderDocumentHandler: RenderDocumentServerFunction = async (args) => {
  const {
    collectionSlug,
    disableActions,
    docID,
    drawerSlug,
    initialData,
    locale,
    overrideEntityVisibility,
    paramsOverride,
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

  const headers = await getHeaders()

  const cookies = parseCookies(headers)

  const incomingUserSlug = user?.collection

  const adminUserSlug = config.admin.user

  // If we have a user slug, test it against the functions
  if (incomingUserSlug) {
    const adminAccessFunction = payload.collections[incomingUserSlug].config.access?.admin

    // Run the admin access function from the config if it exists
    if (adminAccessFunction) {
      const canAccessAdmin = await adminAccessFunction({ req })

      if (!canAccessAdmin) {
        throw new Error('Unauthorized')
      }
      // Match the user collection to the global admin config
    } else if (adminUserSlug !== incomingUserSlug) {
      throw new Error('Unauthorized')
    }
  } else {
    const hasUsers = await payload.find({
      collection: adminUserSlug,
      depth: 0,
      limit: 1,
      pagination: false,
    })

    // If there are users, we should not allow access because of /create-first-user
    if (hasUsers.docs.length) {
      throw new Error('Unauthorized')
    }
  }

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: req.payload.importMap,
  })

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

  const permissions = await getAccessResults({
    req,
  })

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
      languageOptions: undefined, // TODO
      locale,
      permissions,
      req,
      translations: undefined, // TODO
      visibleEntities,
    },
    overrideEntityVisibility,
    params: paramsOverride ?? {
      segments: ['collections', collectionSlug, String(docID)],
    },
    payload,
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
