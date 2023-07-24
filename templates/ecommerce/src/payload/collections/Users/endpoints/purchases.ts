import type { PayloadHandler } from 'payload/config'

export const addPurchases: PayloadHandler = async (req, res): Promise<void> => {
  const { user, payload } = req

  if (!user) {
    res.status(401).send('Unauthorized')
    return
  }

  const fullUser = await payload.findByID({
    collection: 'users',
    id: user?.id,
  })

  if (!fullUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  try {
    const incomingPurchases = req.body.purchases

    if (!incomingPurchases) {
      res.status(404).json({ error: 'No purchases provided' })
      return
    }

    const withNewPurchases = new Set([
      ...(fullUser?.purchases?.map(purchase => {
        return typeof purchase === 'string' ? purchase : purchase.id
      }) || []),
      ...(incomingPurchases || []),
    ])

    await payload.update({
      collection: 'users',
      id: user?.id,
      data: {
        purchases: Array.from(withNewPurchases),
      },
    })

    res.json({ message: 'Purchases added' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)
    res.json({ error: message })
  }
}
