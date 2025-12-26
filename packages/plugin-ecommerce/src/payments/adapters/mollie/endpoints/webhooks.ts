import type { MollieOptions, Payment as MolliePayment } from '@mollie/api-client'
import type { Endpoint } from 'payload'

import { createMollieClient } from '@mollie/api-client'

import type { MollieAdapterArgs } from '../index.js'

type Props = { webhooks?: MollieAdapterArgs['webhooks'] } & Pick<MollieOptions, 'apiKey'>

export const webhooksEndpoint: (props: Props) => Endpoint = (props) => {
  const { apiKey, webhooks } = props || {}

  const handler: Endpoint['handler'] = async (req) => {
    let returnStatus = 200

    if (apiKey && req.formData) {
      const mollie = createMollieClient({
        apiKey,
      })

      const body = await req.formData()
      const paymentId = body.get('id')

      if (paymentId && typeof paymentId === 'string') {
        let payment: MolliePayment | undefined

        try {
          payment = await mollie.payments.get(paymentId)
        } catch (err: unknown) {
          const msg: string = err instanceof Error ? err.message : JSON.stringify(err)
          req.payload.logger.error(`Error retrieving Mollie payment: ${msg}`)
          returnStatus = 400
        }

        if (typeof webhooks === 'object' && payment) {
          const webhookEventHandler = webhooks[payment.status]

          if (typeof webhookEventHandler === 'function') {
            await webhookEventHandler({
              mollie,
              payment,
              req,
            })
          }
        }
      }
    }

    return Response.json({ received: true }, { status: returnStatus })
  }

  return {
    handler,
    method: 'post',
    path: '/webhooks',
  }
}
