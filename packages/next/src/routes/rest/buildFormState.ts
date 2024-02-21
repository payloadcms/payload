import httpStatus from 'http-status'

import {
  BuildFormStateArgs,
  FieldSchemaMap,
  buildFieldSchemaMap,
  buildStateFromSchema,
  reduceFieldsToValues,
} from '@payloadcms/ui'
import { Field, PayloadRequest, SanitizedConfig } from 'payload/types'

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
  const { data: reqData, user, t, locale } = req

  // TODO: run ADMIN access control for user

  const fieldSchemaMap = getFieldSchemaMap(req.payload.config)

  const { id, operation, docPreferences, formState, schemaPath } = reqData as BuildFormStateArgs
  const schemaPathSegments = schemaPath.split('.')

  let fieldSchema: Field[]

  if (schemaPathSegments.length === 1) {
    if (req.payload.collections[schemaPath]) {
      fieldSchema = req.payload.collections[schemaPath].config.fields
    } else if (req.payload.globals[schemaPath]) {
      fieldSchema = req.payload.globals[schemaPath].config.fields
    }
  } else if (fieldSchemaMap.has(schemaPath)) {
    fieldSchema = fieldSchemaMap.get(schemaPath)
  }

  const data = reduceFieldsToValues(formState, true)

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
