import type { BeforeChangeHook } from 'payload/types'

export const populatePublishedAt: BeforeChangeHook = ({ data, operation, req }) => {
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
