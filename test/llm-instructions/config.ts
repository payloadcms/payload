import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { HiddenPages } from './collections/HiddenPages.js'
import { HiddenSettings } from './globals/HiddenSettings.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  suite: 'llm-instructions',
  disableMCP: true,
  seed: async (payload) => {
    const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })

    if (!totalDocs) {
      await payload.create({ collection: 'users', data: devUser, overrideAccess: true })
    }
  },
  config: {
    admin: { importMap: { baseDir: dirname } },
    collections: [
      HiddenPages,
      { slug: 'users', auth: true, fields: [] },
      {
        slug: 'pages',
        access: { read: () => true },
        fields: [{ name: 'title', type: 'text' }],
        labels: {
          plural: { de: 'Seiten', en: 'Pages' },
          singular: { de: 'Seite', en: 'Page' },
        },
        llmInstructions:
          '## System LLM instructions for the Pages Collection\n\n### What to Include\n\n- Use clear headings and concise page content.\n- Use the configured layout blocks.\n\n### What to Avoid\n\n- Do not publish a page without a title.',
      },
    ],
    globals: [
      HiddenSettings,
      {
        slug: 'site-settings',
        fields: [{ name: 'title', type: 'text' }],
        label: { de: 'Einstellungen', en: 'Site Settings' },
      },
    ],
    llmInstructions: {
      access: ({ req }) => req.user?.email === devUser.email,
    },
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
})
