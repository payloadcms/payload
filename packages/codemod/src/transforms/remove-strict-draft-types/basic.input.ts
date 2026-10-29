import { buildConfig } from 'payload'

const strictDraftTypes = process.env.STRICT_DRAFT_TYPES === 'true'

export default buildConfig({
  typescript: {
    strictDraftTypes: true,
    outputFile: './payload-types.ts',
  },
})

export const disabled = {
  typescript: {
    strictDraftTypes: false,
    autoGenerate: true,
  },
}

export const dynamic = {
  typescript: {
    strictDraftTypes,
    autoGenerate: false,
  },
}

export const quoted = {
  'typescript': {
    'strictDraftTypes': strictDraftTypes,
    outputFile: './custom-types.ts',
  },
}
