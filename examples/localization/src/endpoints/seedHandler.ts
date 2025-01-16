import { type PayloadHandler, commitTransaction, initTransaction } from 'payload'

import { seed as seedScript } from '@/endpoints/seed'

export const seedHandler: PayloadHandler = async (req): Promise<Response> => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Create a transaction so that all seeding happens in one transaction
    await initTransaction(req)

    await seedScript({ payload, req })

    // Finalise transactiojn
    await commitTransaction(req)

    return Response.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error({ err: error, message: 'Error seeding data' })
    return Response.json({ error: message }, { status: 500 })
  }
}
