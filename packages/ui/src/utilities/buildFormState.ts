import { type I18nClient } from '@payloadcms/translations'
import {
  type BuildFormStateArgs,
  type ClientUser,
  type DocumentPreferences,
  type ErrorResult,
  type Field,
  formatErrors,
  type FormState,
  type SanitizedConfig,
  type TypeWithID,
} from 'payload'
import { reduceFieldsToValues } from 'payload/shared'

import type { FieldSchemaMap } from './buildFieldSchemaMap/types.js'

import { buildStateFromSchema } from '../forms/buildStateFromSchema/index.js'
import { buildFieldSchemaMap } from './buildFieldSchemaMap/index.js'

let cached = global._payload_fieldSchemaMap

if (!cached) {
  cached = global._payload_fieldSchemaMap = null
}

export const getFieldSchemaMap = (args: {
  config: SanitizedConfig
  i18n: I18nClient
}): FieldSchemaMap => {
  const { config, i18n } = args

  if (cached && process.env.NODE_ENV !== 'development') {
    return cached
  }

  cached = buildFieldSchemaMap({
    config,
    i18n,
  })

  return cached
}

export type BuildFormStateResult =
  | {
      errors?: never
      lockedState?: { isLocked: boolean; user: ClientUser | number | string }
      state: FormState
    }
  | {
      lockedState?: never
      message: string
      state?: never
    }
  | ({
      lockedState?: never
      state?: never
    } & ErrorResult)

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
): Promise<{
  lockedState?: { isLocked: boolean; user: ClientUser | number | string }
  state: FormState
}> => {
  const {
    id: idFromArgs,
    collectionSlug,
    data: dataFromArgs,
    docPreferences: docPreferencesFromArgs,
    formState,
    globalSlug,
    locale,
    operation,
    req,
    returnLockStatus,
    schemaPath,
    updateLastEdited,
  } = args

  if (!req.payload) {
    throw new Error('No Payload instance provided')
  }

  if (!req.payload.config) {
    throw new Error('No config provided')
  }

  const {
    i18n,
    payload,
    payload: { config },
    user,
  } = req

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
    config,
    i18n,
  })

  const id = collectionSlug ? idFromArgs : undefined
  const schemaPathSegments = schemaPath && schemaPath.split('.')

  let fieldSchema: Field[]

  if (schemaPathSegments && schemaPathSegments.length === 1) {
    if (payload.collections[schemaPath]) {
      fieldSchema = payload.collections[schemaPath].config.fields
    } else {
      fieldSchema = payload.config.globals.find((global) => global.slug === schemaPath)?.fields
    }
  } else if (fieldSchemaMap.has(schemaPath)) {
    fieldSchema = fieldSchemaMap.get(schemaPath)
  }

  if (!fieldSchema) {
    throw new Error(`Could not find field schema for given path "${schemaPath}"`)
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

  const result = await buildStateFromSchema({
    id,
    collectionSlug,
    data,
    fieldSchema,
    operation,
    preferences: docPreferences || { fields: {} },
    req,
  })

  // Maintain form state of auth / upload fields
  if (collectionSlug && formState) {
    if (payload.collections[collectionSlug]?.config?.upload && formState.file) {
      result.file = formState.file
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
        const lockedState = {
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

        return { lockedState, state: result }
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

        const lockedState = {
          isLocked: true,
          user,
        }

        return { lockedState, state: result }
      }
    }
  }

  return { state: result }
}
