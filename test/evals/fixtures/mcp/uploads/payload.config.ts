import path from 'node:path'

import { buildMCPEvalConfig, getMCPEvalDatabaseDirectory } from '../buildMCPEvalConfig.js'

const mediaDirectory = path.join(getMCPEvalDatabaseDirectory(), 'media')

export default buildMCPEvalConfig({
  collections: [
    {
      slug: 'media',
      fields: [{ name: 'alt', type: 'text', required: true }],
      upload: {
        mimeTypes: ['image/jpeg', 'image/png'],
        staticDir: mediaDirectory,
      },
    },
  ],
  mcp: {
    collections: {
      media: {},
    },
  },
})
