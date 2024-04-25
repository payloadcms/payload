import type { PayloadRequestWithData } from 'payload/types'

import { Forbidden } from 'payload/errors'

import type { StripeConfig } from '../types.js'

import { stripeProxy } from '../utilities/stripeProxy.js'

export const stripeREST = async (args: {
  req: PayloadRequestWithData
  stripeConfig: StripeConfig
}): Promise<any> => {
  let responseStatus = 200
  let responseJSON

  const { req, stripeConfig } = args

  const {
    data: {
      stripeArgs, // example: ['cus_MGgt3Tuj3D66f2'] or [{ limit: 100 }, { stripeAccount: 'acct_1J9Z4pKZ4Z4Z4Z4Z' }]
      stripeMethod, // example: 'subscriptions.list',
    },
    payload,
    user,
  } = req

  const { stripeSecretKey } = stripeConfig

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
