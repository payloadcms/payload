import type { BeforeChangeHook } from 'payload/dist/collections/config/types'

export const populatePublishedAt: BeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' || operation === 'update') {
    if (req.body && !req.body.publishedAt) {
      const now = new Date()
      return {
        ...data,
        publishedAt: now,
      }
    }
  }

  return data
}
