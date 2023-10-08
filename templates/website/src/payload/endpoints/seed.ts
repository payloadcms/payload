import type { PayloadHandler } from 'payload/config'

import { seed as seedScript } from '../seed'

export const seed: PayloadHandler = async (req, res): Promise<void> => {
  const { user, payload } = req

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    await seedScript(payload)
    res.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)
    res.json({ error: message })
  }
}
