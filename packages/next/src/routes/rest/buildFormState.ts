import type { BuildFormStateArgs } from '@payloadcms/ui/forms/buildStateFromSchema'
import type { DocumentPreferences, Field, PayloadRequestWithData, TypeWithID } from 'payload/types'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import { reduceFieldsToValues } from '@payloadcms/ui/utilities/reduceFieldsToValues'
import httpStatus from 'http-status'

import type { FieldSchemaMap } from '../../utilities/buildFieldSchemaMap/types.js'

import { buildFieldSchemaMap } from '../../utilities/buildFieldSchemaMap/index.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'

let cached = global._payload_fieldSchemaMap

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload_fieldSchemaMap = null
}

export const getFieldSchemaMap = (req: PayloadRequestWithData): FieldSchemaMap => {
  if (cached && process.env.NODE_ENV !== 'development') {
    return cached
  }

  cached = buildFieldSchemaMap(req)

  return cached
}

export const buildFormState = async ({ req }: { req: PayloadRequestWithData }) => {
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

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
            headers,
            status: httpStatus.UNAUTHORIZED,
          })
        }
        // Match the user collection to the global admin config
      } else if (adminUserSlug !== incomingUserSlug) {
        return Response.json(null, {
          headers,
          status: httpStatus.UNAUTHORIZED,
        })
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
        return Response.json(null, {
          headers,
          status: httpStatus.UNAUTHORIZED,
        })
      }
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
          headers,
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

    // Maintain form state of auth / upload fields
    if (collectionSlug && formState) {
      if (req.payload.collections[collectionSlug]?.config?.upload && formState.file) {
        result.file = formState.file
      }

      if (
        req.payload.collections[collectionSlug]?.config?.auth &&
        !req.payload.collections[collectionSlug].config.auth.disableLocalStrategy
      ) {
        if (formState.password) result.password = formState.password
        if (formState.email) result.email = formState.email
      }
    }

    return Response.json(result, {
      headers,
      status: httpStatus.OK,
    })
  } catch (err) {
    return Response.json(
      {
        message: 'There was an error building form state',
      },
      {
        headers,
        status: httpStatus.BAD_REQUEST,
      },
    )
  }
}
