import type { BuildFormStateArgs, FieldSchemaMap } from '@payloadcms/ui'
import type { Field, PayloadRequest, SanitizedConfig } from 'payload/types'

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
  const { data: reqData, locale, t, user } = req

  // TODO: run ADMIN access control for user

  const fieldSchemaMap = getFieldSchemaMap(req.payload.config)

  const {
    id,
    data: incomingData,
    docPreferences,
    formState,
    operation,
    schemaPath,
  } = reqData as BuildFormStateArgs

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

  const data = incomingData || reduceFieldsToValues(formState, true)

  const result = await buildStateFromSchema({
    id,
    data,
    fieldSchema,
    locale,
    operation,
    preferences: docPreferences,
    t,
    user,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
