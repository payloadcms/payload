import lodashGet from 'lodash.get'
import Stripe from 'stripe'

import type { StripeProxy } from '../types'

export const stripeProxy: StripeProxy = async ({ stripeSecretKey, stripeMethod, stripeArgs }) => {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2022-08-01',
    appInfo: {
      name: 'Stripe Payload Plugin',
      url: 'https://payloadcms.com',
    },
  })

  if (typeof stripeMethod === 'string') {
    const topLevelMethod = stripeMethod.split('.')[0] as keyof Stripe
    const contextToBind = stripe[topLevelMethod]
    // NOTE: 'lodashGet' uses dot notation to get the property of an object
    // NOTE: Stripe API methods using reference "this" within their functions, so we need to bind context
    const foundMethod = lodashGet(stripe, stripeMethod).bind(contextToBind)

    if (typeof foundMethod === 'function') {
      if (Array.isArray(stripeArgs)) {
        try {
          const stripeResponse = await foundMethod(...stripeArgs)
          return {
            status: 200,
            data: stripeResponse,
          }
        } catch (error: unknown) {
          return {
            status: 404,
            message: `A Stripe API error has occurred: ${error}`,
          }
        }
      } else {
        throw new Error(`Argument 'stripeArgs' must be an array.`)
      }
    } else {
      throw Error(
        `The provided Stripe method of '${stripeMethod}' is not a part of the Stripe API.`,
      )
    }
  } else {
    throw Error('You must provide a Stripe method to call.')
  }
}
