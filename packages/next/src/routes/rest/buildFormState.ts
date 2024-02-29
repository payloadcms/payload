import type { BuildFormStateArgs, FieldSchemaMap } from '@payloadcms/ui'
import type { DocumentPreferences, Field, PayloadRequest, SanitizedConfig } from 'payload/types'

import { buildFieldSchemaMap, buildStateFromSchema, reduceFieldsToValues } from '@payloadcms/ui'
import httpStatus from 'http-status'

let cached = global._payload_fieldSchemaMap

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload_fieldSchemaMap = null
}

export const getFieldSchemaMap = (config: SanitizedConfig): FieldSchemaMap => {
  if (cached) {
    return cached
  }

  cached = buildFieldSchemaMap(config)

  return cached
}

export const buildFormState = async ({ req }: { req: PayloadRequest }) => {
  const { locale, t, user } = req
  const reqData: BuildFormStateArgs = req.data as BuildFormStateArgs

  // TODO: run ADMIN access control for user

  const fieldSchemaMap = getFieldSchemaMap(req.payload.config)

  const {
    collectionSlug,
    data: incomingData,
    formState,
    globalSlug,
    operation,
    schemaPath,
  } = reqData

  const schemaPathSegments = schemaPath.split('.')

  let fieldSchema: Field[]

  if (schemaPathSegments.length === 1) {
    if (req.payload.collections[schemaPath]) {
      fieldSchema = req.payload.collections[schemaPath].config.fields
    } else {
      fieldSchema = req.payload.config.globals.find((global) => global.slug === schemaPath)?.fields
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

  const data = incomingData || reduceFieldsToValues(formState || {}, true)

  let id: number | string | undefined
  let docPreferencesKey: string
  if (collectionSlug) {
    id = reqData.id
    docPreferencesKey = `collection-${collectionSlug}${id ? `-${id}` : ''}`
  } else {
    docPreferencesKey = `global-${globalSlug}`
  }

  const { docs: [{ value: docPreferences } = { value: null }] = [] } = (await req.payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    where: {
      key: {
        equals: docPreferencesKey,
      },
    },
  })) as any as { docs: { value: DocumentPreferences }[] }

  const result = await buildStateFromSchema({
    id,
    data,
    fieldSchema,
    operation,
    preferences: docPreferences,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
