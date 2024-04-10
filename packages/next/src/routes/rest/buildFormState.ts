import type { BuildFormStateArgs } from '@payloadcms/ui/forms/buildStateFromSchema'
import type { DocumentPreferences, Field, PayloadRequest, TypeWithID } from 'payload/types'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import { reduceFieldsToValues } from '@payloadcms/ui/utilities/reduceFieldsToValues'
import httpStatus from 'http-status'

import type { FieldSchemaMap } from '../../utilities/buildFieldSchemaMap/types.js'

import { buildFieldSchemaMap } from '../../utilities/buildFieldSchemaMap/index.js'

let cached = global._payload_fieldSchemaMap

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload_fieldSchemaMap = null
}

export const getFieldSchemaMap = (req: PayloadRequest): FieldSchemaMap => {
  if (cached && process.env.NODE_ENV !== 'development') {
    return cached
  }

  cached = buildFieldSchemaMap(req)

  return cached
}

export const buildFormState = async ({ req }: { req: PayloadRequest }) => {
  try {
    const reqData: BuildFormStateArgs = req.data as BuildFormStateArgs
    const { collectionSlug, formState, globalSlug, locale, operation, schemaPath } = reqData

    const incomingUserSlug = req.user?.collection
    const adminUserSlug = req.payload.config.admin.user

    // If we have a user slug, test it against the functions
    if (incomingUserSlug) {
      const adminAccessFunction = req.payload.collections[incomingUserSlug].config.access?.admin

      // Run the admin access function from the config if it exists
      if (adminAccessFunction) {
        const canAccessAdmin = await adminAccessFunction({ req })

        if (!canAccessAdmin) {
          return Response.json(null, {
            status: httpStatus.UNAUTHORIZED,
          })
        }
        // Match the user collection to the global admin config
      } else if (adminUserSlug !== incomingUserSlug) {
        return Response.json(null, {
          status: httpStatus.UNAUTHORIZED,
        })
      }
    } else {
      return Response.json(null, {
        status: httpStatus.UNAUTHORIZED,
      })
    }

    const fieldSchemaMap = getFieldSchemaMap(req)

    const id = collectionSlug ? reqData.id : undefined
    const schemaPathSegments = schemaPath.split('.')

    let fieldSchema: Field[]

    if (schemaPathSegments.length === 1) {
      if (req.payload.collections[schemaPath]) {
        fieldSchema = req.payload.collections[schemaPath].config.fields
      } else {
        fieldSchema = req.payload.config.globals.find(
          (global) => global.slug === schemaPath,
        )?.fields
      }
    } else if (fieldSchemaMap.has(schemaPath)) {
      fieldSchema = fieldSchemaMap.get(schemaPath)
    }

    if (!fieldSchema) {
      return Response.json(
        {
          message: 'Could not find field schema for given path',
        },
        {
          status: httpStatus.BAD_REQUEST,
        },
      )
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
    // when we fetch data for the Edit view
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
              key: {
                equals: preferencesKey,
              },
            },
          })) as unknown as { docs: { value: DocumentPreferences }[] }

          if (preferencesResult?.docs?.[0]?.value) docPreferences = preferencesResult.docs[0].value
        }

        promises.preferences = fetchPreferences()
      }
    }

    // If there is a form state,
    // then we can deduce data from that form state
    if (formState) data = reduceFieldsToValues(formState, true)

    // If we do not have data at this point,
    // we can fetch it. This is useful for DocumentInfoProvider
    // to reduce the amount of fetches required
    if (!data) {
      const fetchData = async () => {
        let resolvedData: TypeWithID

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

        if (globalSlug) {
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

    if (Object.keys(promises).length > 0) {
      await Promise.all(Object.values(promises))
    }

    const result = await buildStateFromSchema({
      id,
      data,
      fieldSchema,
      operation,
      preferences: docPreferences || { fields: {} },
      req,
    })

    return Response.json(result, {
      status: httpStatus.OK,
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: `There was an error building form state` })

    return Response.json(
      {
        message: 'There was an error building form state',
      },
      {
        status: httpStatus.BAD_REQUEST,
      },
    )
  }
}
