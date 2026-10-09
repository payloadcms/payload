import { buildConfig } from 'payload'

const strictDraftTypes = process.env.STRICT_DRAFT_TYPES === 'true'

export default buildConfig({
  typescript: {
    outputFile: './payload-types.ts',
  },
})

export const disabled = {
  typescript: {
    autoGenerate: true,
  },
}

export const dynamic = {
  typescript: {
    autoGenerate: false,
  },
}

export const quoted = {
  'typescript': {
    outputFile: './custom-types.ts',
  },
}
