/* eslint-disable no-restricted-exports */
import { defineRscConfig } from 'payload/shared'

import { CustomGlobalTextDescription } from './components/CustomGlobalTextDescription.js'

export default defineRscConfig({
  'menu.globalText': {
    components: {
      Description: <CustomGlobalTextDescription />,
    },
  },
})
