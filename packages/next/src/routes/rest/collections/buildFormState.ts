import httpStatus from 'http-status'

import { CollectionRouteHandler } from '../types'

import { BuildFormStateArgs, buildStateFromSchema, reduceFieldsToValues } from '@payloadcms/ui'

export const buildFormStateCollection: CollectionRouteHandler = async ({ req, collection }) => {
  const { data: reqData, user, t, locale } = req

  const { id, operation, docPreferences, formState } = reqData as BuildFormStateArgs

  const data = reduceFieldsToValues(formState, true)

  const result = await buildStateFromSchema({
    id,
    data,
    fieldSchema: collection.config.fields,
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
