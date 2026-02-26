/* eslint-disable no-restricted-exports */
import { defineSharedConfig } from 'payload/shared'

export default defineSharedConfig({
  fields: {
    'posts.title': {
      validate: (value) => {
        if (typeof value === 'string' && value.length > 20) {
          return 'Title must be 20 characters or fewer'
        }
        return true
      },
    },
  },
})
