import httpStatus from 'http-status'

import { GlobalRouteHandler } from '../types'

import { BuildFormStateArgs, buildStateFromSchema, reduceFieldsToValues } from '@payloadcms/ui'

export const buildFormStateGlobal: GlobalRouteHandler = async ({ req, globalConfig }) => {
  const { data: reqData, user, t, locale } = req

  const { docPreferences, formState } = reqData as BuildFormStateArgs

  const data = reduceFieldsToValues(formState, true)

  const result = await buildStateFromSchema({
    data,
    fieldSchema: globalConfig.fields,
    locale,
    preferences: docPreferences,
    t,
    user,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
