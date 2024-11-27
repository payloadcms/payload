import type { PayloadHandler } from 'payload'

/* import { seed as seedScript } from '../seed' */

export const seed: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    /* await seedScript(payload) */

    return Response.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)

    return Response.json({ error: message }, { status: 500 })
  }
}
