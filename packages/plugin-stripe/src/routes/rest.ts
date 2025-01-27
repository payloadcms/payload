import type { Response } from 'express'
import type { PayloadRequest } from 'payload/types'

import { Forbidden } from 'payload/errors'

import type { StripeConfig } from '../types'

import { stripeProxy } from '../utilities/stripeProxy'

export const stripeREST = async (args: {
  next: any
  req: PayloadRequest
  res: Response
  stripeConfig: StripeConfig
}): Promise<any> => {
  const { req, res, stripeConfig } = args

  const {
    body: {
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
      throw new Forbidden()
    }

    const pluginRes = await stripeProxy({
      stripeArgs,
      stripeMethod,
      stripeSecretKey,
    })

    const { status } = pluginRes

    res.status(status).json(pluginRes)
  } catch (error: unknown) {
    const message = `An error has occurred in the Stripe plugin REST handler: '${error}'`
    payload.logger.error(message)
    return res.status(500).json({
      message,
    })
  }
}
