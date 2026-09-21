import type { PayloadRequest } from 'payload'

import { addDataAndFileToRequest, canAccessAdmin, UnauthorizedError } from 'payload'

import type { SanitizedStripePluginConfig } from '../types.js'

import { stripeProxy } from '../utilities/stripeProxy.js'

export const stripeREST = async (args: {
  pluginConfig: SanitizedStripePluginConfig
  req: PayloadRequest
}): Promise<Response> => {
  const { pluginConfig, req } = args

  try {
    await addDataAndFileToRequest(req)
  } catch (err) {
    return unexpectedErrorResponse({ err, req })
  }

  if (!req.user) {
    return errorResponse({ message: 'Unauthorized', status: 401 })
  }

  if (!pluginConfig.rest) {
    return unexpectedErrorResponse({
      err: new Error('Stripe REST handler called while disabled'),
      req,
    })
  }

  let hasAccess: boolean

  if (pluginConfig.rest.access) {
    try {
      hasAccess = await pluginConfig.rest.access({ req })
    } catch (err) {
      return unexpectedErrorResponse({ err, req })
    }
  } else {
    try {
      hasAccess = await hasAdminAccess({ req })
    } catch (err) {
      return unexpectedErrorResponse({ err, req })
    }
  }

  if (!hasAccess) {
    return errorResponse({ message: 'Forbidden', status: 403 })
  }

  const { stripeArgs, stripeMethod } = req.data ?? {}

  if (
    typeof stripeMethod !== 'string' ||
    stripeMethod.trim().length === 0 ||
    !pluginConfig.rest.allowedMethods.includes(stripeMethod)
  ) {
    return errorResponse({ message: 'Invalid request', status: 400 })
  }

  if (!Array.isArray(stripeArgs)) {
    return errorResponse({ message: 'Invalid request', status: 400 })
  }

  try {
    const responseJSON = await stripeProxy({
      stripeArgs,
      stripeMethod,
      stripeSecretKey: pluginConfig.stripeSecretKey,
    })

    return Response.json(responseJSON, { status: responseJSON.status })
  } catch (err) {
    return unexpectedErrorResponse({ err, req })
  }
}

const hasAdminAccess = async ({ req }: { req: PayloadRequest }): Promise<boolean> => {
  try {
    await canAccessAdmin({ req })
    return true
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return false
    }

    throw err
  }
}

const errorResponse = ({ message, status }: { message: string; status: number }): Response =>
  Response.json({ message }, { status })

const unexpectedErrorResponse = ({ err, req }: { err: unknown; req: PayloadRequest }): Response => {
  req.payload.logger.error({
    err,
    msg: 'An unexpected error occurred in the Stripe plugin REST handler.',
  })

  return errorResponse({ message: 'Internal server error', status: 500 })
}
