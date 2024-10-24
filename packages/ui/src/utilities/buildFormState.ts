import type { I18n, I18nClient } from '@payloadcms/translations'
import type {
  BuildFormStateArgs,
  ClientConfig,
  ClientUser,
  DocumentPreferences,
  ErrorResult,
  FieldSchemaMap,
  FormState,
  SanitizedConfig,
  TypeWithID,
} from 'payload'

import { headers as getHeaders } from 'next/headers.js'
import { createClientConfig, formatErrors } from 'payload'
import { reduceFieldsToValues } from 'payload/shared'

import { buildStateFromSchema } from '../forms/buildStateFromSchema/index.js'
import { attachComponentsToFormState } from './attachComponentsToFormState.js'
import { buildFieldSchemaMap } from './buildFieldSchemaMap/index.js'

let cachedFieldMap = global._payload_fieldMap
let cachedClientConfig = global._payload_clientConfig

if (!cachedFieldMap) {
  cachedFieldMap = global._payload_fieldMap = null
}

if (!cachedClientConfig) {
  cachedClientConfig = global._payload_clientConfig = null
}

export const getFieldSchemaMap = (args: {
  collectionSlug?: string
  config: SanitizedConfig
  globalSlug?: string
  i18n: I18nClient
}): FieldSchemaMap => {
  const { collectionSlug, config, globalSlug, i18n } = args

  if (process.env.NODE_ENV !== 'development') {
    if (!cachedFieldMap) {
      cachedFieldMap = new Map()
    }
    const cachedEntityFieldMap = cachedFieldMap.get(collectionSlug || globalSlug)
    if (cachedEntityFieldMap) {
      return cachedEntityFieldMap
    }
  }

  const { fieldSchemaMap: entityFieldMap } = buildFieldSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n: i18n as I18n,
  })

  if (process.env.NODE_ENV !== 'development') {
    cachedFieldMap.set(collectionSlug || globalSlug, entityFieldMap)
  }

  return entityFieldMap
}

export const getClientConfig = (args: {
  config: SanitizedConfig
  i18n: I18nClient
}): ClientConfig => {
  const { config, i18n } = args

  if (cachedClientConfig && process.env.NODE_ENV !== 'development') {
    return cachedClientConfig
  }

  cachedClientConfig = createClientConfig({
    config,
    i18n,
  })

  return cachedClientConfig
}

type BuildFormStateSuccessResult = {
  clientConfig?: ClientConfig
  errors?: never
  indexPath?: string
  lockedState?: { isLocked: boolean; user: ClientUser | number | string }
  state: FormState
}

type BuildFormStateErrorResult = {
  lockedState?: never
  renderedFieldMap?: never
  state?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export type BuildFormStateResult = BuildFormStateErrorResult | BuildFormStateSuccessResult

export const buildFormState = async (args: BuildFormStateArgs): Promise<BuildFormStateResult> => {
  const { req } = args

  try {
    const res = await buildFormStateFn(args)
    return res
  } catch (err) {
    req.payload.logger.error({ err, msg: `There was an error building form state` })

    if (err.message === 'Could not find field schema for given path') {
      return {
        message: err.message,
      }
    }

    if (err.message === 'Unauthorized') {
      return null
    }

    return formatErrors(err)
  }
}

export const buildFormStateFn = async (
  args: BuildFormStateArgs,
): Promise<BuildFormStateSuccessResult> => {
  const {
    id: idFromArgs,
    collectionSlug,
    data: dataFromArgs,
    docPreferences: docPreferencesFromArgs,
    formState,
    globalSlug,
    locale,
    operation,
    path = '',
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    returnLockStatus,
    schemaPath = collectionSlug || globalSlug,
    updateLastEdited,
  } = args

  if (!collectionSlug && !globalSlug) {
    throw new Error('Either collectionSlug or globalSlug must be provided')
  }

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

  const fieldSchemaMap = getFieldSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n,
  })

  const id = collectionSlug ? idFromArgs : undefined

  const fieldOrEntityConfig = fieldSchemaMap.get(schemaPath)

  if (!fieldOrEntityConfig) {
    throw new Error(`Could not find "${schemaPath}" in the fieldSchemaMap`)
  }

  if (!('fields' in fieldOrEntityConfig) || !fieldOrEntityConfig.fields) {
    throw new Error(
      `The field found in fieldSchemaMap for "${schemaPath}" does not contain any subfields.`,
    )
  }

  let docPreferences = docPreferencesFromArgs
  let data = dataFromArgs

  const promises: {
    data?: Promise<void>
    preferences?: Promise<void>
  } = {}

  // If the request does not include doc preferences,
  // we should fetch them. This is useful for DocumentInfoProvider
  // as it reduces the amount of client-side fetches necessary
  // when we fetch data for the Edit View
  if (!docPreferences) {
    let preferencesKey

    if (collectionSlug && id) {
      preferencesKey = `collection-${collectionSlug}-${id}`
    }

    if (globalSlug) {
      preferencesKey = `global-${globalSlug}`
    }

    if (preferencesKey) {
      const fetchPreferences = async () => {
        const preferencesResult = (await payload.find({
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
        })) as unknown as { docs: { value: DocumentPreferences }[] }

        if (preferencesResult?.docs?.[0]?.value) {
          docPreferences = preferencesResult.docs[0].value
        }
      }

      promises.preferences = fetchPreferences()
    }
  }

  // If there is a form state,
  // then we can deduce data from that form state
  if (formState) {
    data = reduceFieldsToValues(formState, true)
  }

  // If we do not have data at this point,
  // we can fetch it. This is useful for DocumentInfoProvider
  // to reduce the amount of fetches required
  if (!data) {
    const fetchData = async () => {
      let resolvedData: Record<string, unknown> | TypeWithID

      if (collectionSlug && id) {
        resolvedData = await payload.findByID({
          id,
          collection: collectionSlug,
          depth: 0,
          draft: true,
          fallbackLocale: null,
          locale,
          overrideAccess: false,
          user,
        })
      }

      if (globalSlug && schemaPath === globalSlug) {
        resolvedData = await payload.findGlobal({
          slug: globalSlug,
          depth: 0,
          draft: true,
          fallbackLocale: null,
          locale,
          overrideAccess: false,
          user,
        })
      }

      data = resolvedData
    }

    promises.data = fetchData()
  }

  if (Object.keys(promises) && Object.keys(promises).length > 0) {
    await Promise.all(Object.values(promises))
  }

  const formStateResult = await buildStateFromSchema({
    id,
    collectionSlug,
    data,
    fields: fieldOrEntityConfig.fields,
    operation,
    path,
    preferences: docPreferences || { fields: {} },
    req,
  })

  let lockedStateResult = undefined

  // Maintain form state of auth / upload fields
  if (collectionSlug && formState) {
    if (payload.collections[collectionSlug]?.config?.upload && formState.file) {
      formStateResult.file = formState.file
    }
  }

  if (returnLockStatus && user && (id || globalSlug)) {
    let lockedDocumentQuery

    if (collectionSlug) {
      lockedDocumentQuery = {
        and: [
          { 'document.relationTo': { equals: collectionSlug } },
          { 'document.value': { equals: id } },
        ],
      }
    } else if (globalSlug) {
      lockedDocumentQuery = {
        globalSlug: { equals: globalSlug },
      }
    }

    if (lockedDocumentQuery) {
      const lockedDocument = await payload.find({
        collection: 'payload-locked-documents',
        depth: 1,
        limit: 1,
        pagination: false,
        where: lockedDocumentQuery,
      })

      if (lockedDocument.docs && lockedDocument.docs.length > 0) {
        lockedStateResult = {
          isLocked: true,
          user: lockedDocument.docs[0]?.user?.value,
        }

        if (updateLastEdited) {
          await payload.db.updateOne({
            id: lockedDocument.docs[0].id,
            collection: 'payload-locked-documents',
            data: {},
            req,
          })
        }
      } else {
        // If no lock document exists, create it
        await payload.db.create({
          collection: 'payload-locked-documents',
          data: {
            document: collectionSlug
              ? {
                  relationTo: [collectionSlug],
                  value: id,
                }
              : undefined,
            globalSlug: globalSlug ? globalSlug : undefined,
            user: {
              relationTo: [user.collection],
              value: user.id,
            },
          },
          req,
        })

        lockedStateResult = {
          isLocked: true,
          user,
        }
      }
    }
  }

  const headers = await getHeaders()
  const { permissions } = await payload.auth({ headers, req })

  // mutates form state and adds custom components to field paths
  attachComponentsToFormState({
    config,
    entitySlug: collectionSlug || globalSlug,
    fieldSchemaMap,
    formState: formStateResult,
    i18n,
    payload: req.payload,
    permissions,
  })

  return {
    lockedState: lockedStateResult,
    state: formStateResult,
  }
}
