import type { StripeWebhookHandler } from '@payloadcms/plugin-stripe/types'
import type { TaskHandler } from 'payload'
import type Stripe from 'stripe'

export const chargeSucceeded: StripeWebhookHandler<{
  data: {
    object: Stripe.Charge
  }
}> = async (args) => {
  const { event, stripe, req, payload } = args

  // Do your fast processing here

  // Schedule a task to do the heavy lifting
  await payload.jobs.queue({
    task: 'stripePaymentSucceeded',
    queue: 'stripeWebhooks',
    input: {
      event: JSON.stringify(event),
    },
  })

  // Run the tasks in the queue asynchronously
  payload.jobs.run({ queue: 'stripeWebhooks' })
}

export const chargeSucceededTask: TaskHandler<'stripePaymentSucceeded'> = async ({
  input,
  job,
  req,
}) => {
  const event = JSON.parse(input.event)
  const payload = req.payload

  payload.logger.info({ msg: `event: ${event}` })
  return { output: {} }
}
