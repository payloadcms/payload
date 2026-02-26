/* eslint-disable no-restricted-exports */
import { defineAdminConfig } from 'payload/shared'
import React from 'react'

import { CustomGlobalTextDescription } from './components/CustomGlobalTextDescription.js'
import { CustomTitleLabel } from './components/CustomTitleLabel.js'
import sharedConfig from './payload.config.shared.js'

export default defineAdminConfig({
  fields: {
    'menu.globalText': {
      components: {
        Description: <CustomGlobalTextDescription />,
      },
    },
    'posts.title': {
      components: {
        Label: CustomTitleLabel,
      },
      validate: sharedConfig.fields?.['posts.title']?.validate,
    },
  },
})
