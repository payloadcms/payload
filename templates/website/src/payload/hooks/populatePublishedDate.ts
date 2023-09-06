import type { BeforeChangeHook } from 'payload/dist/collections/config/types'

export const populatePublishedDate: BeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' || operation === 'update') {
    if (req.body && !req.body.publishedDate) {
      const now = new Date()
      return {
        ...data,
        publishedDate: now,
      }
    }
  }

  return data
}
