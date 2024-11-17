import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientConfig,
  Data,
  DocumentPreferences,
  FormState,
  ImportMap,
  PayloadRequest,
  SanitizedConfig,
  VisibleEntities,
} from 'payload'

import { headers as getHeaders } from 'next/headers.js'
import { createClientConfig, getAccessResults, isEntityHidden, parseCookies } from 'payload'

import { renderDocument } from './index.js'

let cachedClientConfig = global._payload_clientConfig

if (!cachedClientConfig) {
  cachedClientConfig = global._payload_clientConfig = null
}

export const getClientConfig = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  importMap: ImportMap
}): ClientConfig => {
  const { config, i18n, importMap } = args

  if (cachedClientConfig && process.env.NODE_ENV !== 'development') {
    return cachedClientConfig
  }

  cachedClientConfig = createClientConfig({
    config,
    i18n,
    importMap,
  })

  return cachedClientConfig
}

type RenderDocumentResult = {
  data: any
  Document: React.ReactNode
  preferences: DocumentPreferences
}

export const renderDocumentHandler = async (args: {
  collectionSlug: string
  disableActions?: boolean
  docID: string
  drawerSlug?: string
  initialData?: Data
  initialState?: FormState
  redirectAfterDelete: boolean
  redirectAfterDuplicate: boolean
  req: PayloadRequest
}): Promise<RenderDocumentResult> => {
  const {
    collectionSlug,
    disableActions,
    docID,
    drawerSlug,
    initialData,
    redirectAfterDelete,
    redirectAfterDuplicate,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
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
    drawerSlug,
    importMap: payload.importMap,
    initialData,
    initPageResult: {
      collectionConfig: payload.config.collections.find(
        (collection) => collection.slug === collectionSlug,
      ),
      cookies,
      docID,
      globalConfig: payload.config.globals.find((global) => global.slug === collectionSlug),
      languageOptions: undefined, // TODO
      permissions,
      req,
      translations: undefined, // TODO
      visibleEntities,
    },
    params: {
      segments: ['collections', collectionSlug, docID],
    },
    redirectAfterDelete,
    redirectAfterDuplicate,
    searchParams: {},
  })

  return {
    data,
    Document,
    preferences,
  }
}
