/* eslint-disable no-restricted-exports */
import { defineRscConfig } from 'payload/shared'
import React from 'react'

import { CustomGlobalTextDescription } from './components/CustomGlobalTextDescription.js'

export default defineRscConfig({
  fields: {
    'menu.globalText': {
      components: {
        Description: CustomGlobalTextDescription,
      },
    },
  },
})
