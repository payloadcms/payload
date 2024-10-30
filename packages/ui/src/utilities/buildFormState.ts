import type {
  ClientUser,
  DocumentPreferences,
  Field,
  FormState,
  PayloadRequest,
  TypeWithID,
} from 'payload'

import { reduceFieldsToValues } from 'payload/shared'

import type { BuildFormStateArgs } from '../forms/buildStateFromSchema/index.js'
import type { FieldSchemaMap } from './buildFieldSchemaMap/types.js'

import { buildStateFromSchema } from '../forms/buildStateFromSchema/index.js'
import { buildFieldSchemaMap } from './buildFieldSchemaMap/index.js'

let cached = global._payload_fieldSchemaMap

if (!cached) {
  cached = global._payload_fieldSchemaMap = null
}

export const getFieldSchemaMap = (req: PayloadRequest): FieldSchemaMap => {
  if (cached && process.env.NODE_ENV !== 'development') {
    return cached
  }

  cached = buildFieldSchemaMap({
    config: req.payload.config,
    i18n: req.i18n,
  })

  return cached
}

export const buildFormState = async ({
  req,
}: {
  req: PayloadRequest
}): Promise<{
  lockedState?: { isLocked: boolean; user: ClientUser | number | string }
  state: FormState
}> => {
  const reqData: BuildFormStateArgs = (req.data || {}) as BuildFormStateArgs
  const {
    collectionSlug,
    formState,
    globalSlug,
    locale,
    operation,
    returnLockStatus,
    schemaPath,
    updateLastEdited,
  } = reqData

  const incomingUserSlug = req.user?.collection
  const adminUserSlug = req.payload.config.admin.user

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

  const fieldSchemaMap = getFieldSchemaMap(req)

  const id = collectionSlug ? reqData.id : undefined
  const schemaPathSegments = schemaPath && schemaPath.split('.')

  let fieldSchema: Field[]

  if (schemaPathSegments && schemaPathSegments.length === 1) {
    if (req.payload.collections[schemaPath]) {
      fieldSchema = req.payload.collections[schemaPath].config.fields
    } else {
      fieldSchema = req.payload.config.globals.find((global) => global.slug === schemaPath)?.fields
    }
  } else if (fieldSchemaMap.has(schemaPath)) {
    fieldSchema = fieldSchemaMap.get(schemaPath)
  }

  if (!fieldSchema) {
    throw new Error(`Could not find field schema for given path "${schemaPath}"`)
  }

  let docPreferences = reqData.docPreferences
  let data = reqData.data

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
        const preferencesResult = (await req.payload.find({
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
                  equals: req.user.collection,
                },
              },
              {
                'user.value': {
                  equals: req.user.id,
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
        resolvedData = await req.payload.findByID({
          id,
          collection: collectionSlug,
          depth: 0,
          draft: true,
          fallbackLocale: null,
          locale,
          overrideAccess: false,
          user: req.user,
        })
      }

      if (globalSlug && schemaPath === globalSlug) {
        resolvedData = await req.payload.findGlobal({
          slug: globalSlug,
          depth: 0,
          draft: true,
          fallbackLocale: null,
          locale,
          overrideAccess: false,
          user: req.user,
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
    if (req.payload.collections[collectionSlug]?.config?.upload && formState.file) {
      result.file = formState.file
    }
  }

  if (returnLockStatus && req.user && (id || globalSlug)) {
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
        const lockedState = {
          isLocked: true,
          user: lockedDocument.docs[0]?.user?.value,
        }

        if (updateLastEdited) {
          await req.payload.db.updateOne({
            id: lockedDocument.docs[0].id,
            collection: 'payload-locked-documents',
            data: {},
            req,
          })
        }

        return { lockedState, state: result }
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
              relationTo: [req.user.collection],
              value: req.user.id,
            },
          },
          req,
        })

        const lockedState = {
          isLocked: true,
          user: req.user,
        }

        return { lockedState, state: result }
      }
    }
  }

  return { state: result }
}
