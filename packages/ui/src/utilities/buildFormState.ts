import type { I18n, I18nClient } from '@payloadcms/translations'
import type {
  BuildFormStateArgs,
  ClientConfig,
  ClientUser,
  DocumentPreferences,
  ErrorResult,
  Field,
  FieldSchemaMap,
  FormState,
  SanitizedConfig,
  TypeWithID,
} from 'payload'

import { headers as getHeaders } from 'next/headers.js'
import { createClientConfig, formatErrors } from 'payload'
import { reduceFieldsToValues } from 'payload/shared'

import { fieldSchemasToFormState } from '../forms/fieldSchemasToFormState/index.js'
import { prepareFields } from '../forms/Form/prepareFields.js'
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
  lockedState?: { isLocked: boolean; lastEditedAt: string; user: ClientUser | number | string }
  state: FormState
}

type BuildFormStateErrorResult = {
  lockedState?: never
  state?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export type BuildFormStateResult = BuildFormStateErrorResult | BuildFormStateSuccessResult

export const buildFormStateHandler = async (
  args: BuildFormStateArgs,
): Promise<BuildFormStateResult> => {
  const { req } = args

  const incomingUserSlug = req.user?.collection
  const adminUserSlug = req.payload.config.admin.user

  try {
    // If we have a user slug, test it against the functions
    if (incomingUserSlug) {
      const adminAccessFunction = req.payload.collections[incomingUserSlug].config.access?.admin

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
      const hasUsers = await req.payload.find({
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

    const res = await buildFormState(args)
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

export const buildFormState = async (
  args: BuildFormStateArgs,
): Promise<BuildFormStateSuccessResult> => {
  const {
    id: idFromArgs,
    collectionSlug,
    data: incomingData,
    docPermissions,
    docPreferences,
    formState,
    globalSlug,
    operation,
    path = [],
    renderFields = false,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    returnLockStatus,
    schemaPath = collectionSlug ? [collectionSlug] : [globalSlug],
    updateLastEdited,
  } = args

  let data = incomingData

  if (!collectionSlug && !globalSlug) {
    throw new Error('Either collectionSlug or globalSlug must be provided')
  }

  const fieldSchemaMap = getFieldSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n,
  })

  const schemaPathsToRender = []
  if (renderFields) {
    schemaPathsToRender.push(...fieldSchemaMap.keys())
  } else if (formState) {
    for (const key in formState) {
      const field = formState[key]

      if (field?.requiresRender) {
        schemaPathsToRender.push(field.schemaPath.join('.'))
      }
    }
  }

  const id = collectionSlug ? idFromArgs : undefined
  const fieldOrEntityConfig = fieldSchemaMap.get(schemaPath.join('.'))

  if (!fieldOrEntityConfig) {
    throw new Error(`Could not find "${schemaPath.join('.')}" in the fieldSchemaMap`)
  }

  if (
    (!('fields' in fieldOrEntityConfig) ||
      !fieldOrEntityConfig.fields ||
      !fieldOrEntityConfig.fields.length) &&
    'type' in fieldOrEntityConfig &&
    fieldOrEntityConfig.type !== 'blocks'
  ) {
    throw new Error(
      `The field found in fieldSchemaMap for "${schemaPath.join('.')}" does not contain any subfields.`,
    )
  }

  // If there is a form state,
  // then we can deduce data from that form state
  if (formState) {
    // formState may contain _index- paths (e.g. from row fields). In order to get the data that should not contain those,
    // we use prepareFields to remove those paths

    // TODO: don't use this prepareFields monstrosity
    // instead, make sure _index paths have disableFormState
    // that way, reduceFieldsToValues can safely disregard disableFormState
    const sanitizedFormState = prepareFields(formState)
    data = reduceFieldsToValues(sanitizedFormState, true)
  }

  const isEntitySchema =
    schemaPath.length === 1 && (schemaPath[0] === collectionSlug || schemaPath[0] === globalSlug)

  /**
   * When building state for sub schemas we need to adjust:
   * - `fields`
   * - `parentSchemaPath`
   * - `parentPath`
   *
   * Type assertion is fine because we wrap sub schemas in an array
   * so we can safely map over them within `fieldSchemasToFormState`
   */
  const fields = Array.isArray(fieldOrEntityConfig)
    ? fieldOrEntityConfig
    : 'fields' in fieldOrEntityConfig
      ? fieldOrEntityConfig.fields
      : [fieldOrEntityConfig]
  const parentSchemaPath = isEntitySchema ? schemaPath : schemaPath.slice(0, -1)
  const parentPath = isEntitySchema ? path : path.slice(0, -1)

  const formStateResult = await fieldSchemasToFormState({
    id,
    collectionSlug,
    data,
    fields,
    operation,
    parentPath,
    parentSchemaPath,
    preferences: docPreferences || { fields: {} },
    req,
    schemaPathsToRender,
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
        and: [{ globalSlug: { equals: globalSlug } }],
      }
    }

    const lockDurationDefault = 300 // Default 5 minutes in seconds
    const lockDocumentsProp = collectionSlug
      ? req.payload.config.collections.find((c) => c.slug === collectionSlug)?.lockDocuments
      : req.payload.config.globals.find((g) => g.slug === globalSlug)?.lockDocuments

    const lockDuration =
      typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault
    const lockDurationInMilliseconds = lockDuration * 1000
    const now = new Date().getTime()

    if (lockedDocumentQuery) {
      // Query where the lock is newer than the current time minus the lock duration
      lockedDocumentQuery.and.push({
        updatedAt: {
          greater_than: new Date(now - lockDurationInMilliseconds).toISOString(),
        },
      })

      const lockedDocument = await req.payload.find({
        collection: 'payload-locked-documents',
        depth: 1,
        limit: 1,
        pagination: false,
        where: lockedDocumentQuery,
      })

      if (lockedDocument.docs && lockedDocument.docs.length > 0) {
        lockedStateResult = {
          isLocked: true,
          lastEditedAt: lockedDocument.docs[0]?.updatedAt,
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
        // If NO ACTIVE lock document exists, first delete any expired locks and then create a fresh lock
        // Where updatedAt is older than the duration that is specified in the config
        let deleteExpiredLocksQuery

        if (collectionSlug) {
          deleteExpiredLocksQuery = {
            and: [
              { 'document.relationTo': { equals: collectionSlug } },
              {
                updatedAt: {
                  less_than: new Date(now - lockDurationInMilliseconds).toISOString(),
                },
              },
            ],
          }
        } else if (globalSlug) {
          deleteExpiredLocksQuery = {
            and: [
              { globalSlug: { equals: globalSlug } },
              {
                updatedAt: {
                  less_than: new Date(now - lockDurationInMilliseconds).toISOString(),
                },
              },
            ],
          }
        }

        await req.payload.db.deleteMany({
          collection: 'payload-locked-documents',
          req,
          where: deleteExpiredLocksQuery,
        })

        await req.payload.db.create({
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
          lastEditedAt: new Date().toISOString(),
          user: req.user,
        }
      }
    }
  }

  // mutates form state and adds custom components to field paths
  // attachComponentsToFormState({
  //   config,
  //   fieldSchemaMap,
  //   formState: formStateResult,
  //   i18n,
  //   payload: req.payload,
  //   permissions: docPermissions,
  //   schemaPathsToRender,
  // })

  return {
    lockedState: lockedStateResult,
    state: formStateResult,
  }
}
