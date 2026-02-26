/* eslint-disable no-restricted-exports */
'use client'
import { defineClientConfig } from 'payload/shared'

import { CustomTitleLabel } from './components/CustomTitleLabel.js'

export default defineClientConfig({
  fields: {
    'posts.title': {
      components: {
        Label: CustomTitleLabel,
      },
    },
  },
})
