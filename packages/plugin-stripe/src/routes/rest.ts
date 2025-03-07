import type { PayloadRequest } from 'payload'

import { addDataAndFileToRequest, Forbidden } from 'payload'

import type { StripePluginConfig } from '../types.js'

import { stripeProxy } from '../utilities/stripeProxy.js'

export const stripeREST = async (args: {
  pluginConfig: StripePluginConfig
  req: PayloadRequest
}): Promise<any> => {
  let responseStatus = 200
  let responseJSON

  const { pluginConfig, req } = args

  await addDataAndFileToRequest(req)

  const requestWithData = req

  const {
    data: {
      stripeArgs, // example: ['cus_MGgt3Tuj3D66f2'] or [{ limit: 100 }, { stripeAccount: 'acct_1J9Z4pKZ4Z4Z4Z4Z' }]
      stripeMethod, // example: 'subscriptions.list',
    },
    payload,
    user,
  } = requestWithData

  const { stripeSecretKey } = pluginConfig

  try {
    if (!user) {
      // TODO: make this customizable from the config
      throw new Forbidden(req.t)
    }

    responseJSON = await stripeProxy({
      stripeArgs,
      stripeMethod,
      stripeSecretKey,
    })

    const { status } = responseJSON
    responseStatus = status
  } catch (error: unknown) {
    const message = `An error has occurred in the Stripe plugin REST handler: '${JSON.stringify(
      error,
    )}'`
    payload.logger.error(message)
    responseStatus = 500
    responseJSON = {
      message,
    }
  }

  return Response.json(responseJSON, {
    status: responseStatus,
  })
}
