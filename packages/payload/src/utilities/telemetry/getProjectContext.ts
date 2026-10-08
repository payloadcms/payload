import type { Payload } from '../../types/index.js'

export type FigmaProduct = 'make'

export type ProjectCohort = 'cloud' | 'enterprise' | 'figma' | 'oss'

type Args = {
  env?: NodeJS.ProcessEnv
  packages?: string[]
  payload: Payload
  plugins: string[]
}

export const enterprisePackageNames = new Set([
  '@payloadcms/ai-model-adapter',
  '@payloadcms/plugin-ab-testing',
  '@payloadcms/plugin-admin-only',
  '@payloadcms/plugin-ai-embeddings',
  '@payloadcms/plugin-ai-translate',
  '@payloadcms/plugin-audit-logs',
  '@payloadcms/plugin-csm',
  '@payloadcms/plugin-email-builder',
  '@payloadcms/plugin-environments',
  '@payloadcms/plugin-oauth2',
  '@payloadcms/plugin-publication-workflows',
  '@payloadcms/plugin-visual-editing',
  '@payloadcms/visual-editing',
])

export const getProjectContext = ({
  env = process.env,
  packages = [],
  payload,
  plugins,
}: Args): { figmaProduct?: FigmaProduct; projectCohorts: ProjectCohort[] } => {
  const projectCohorts: ProjectCohort[] = []

  if ([...packages, ...plugins].some((name) => enterprisePackageNames.has(name))) {
    projectCohorts.push('enterprise')
  }

  let figmaProduct: FigmaProduct | undefined

  if (payload.config.custom?.figma) {
    projectCohorts.push('figma')

    const isMakeSandbox = env.FIGMA === '1' || env.FIGMA === 'true'
    figmaProduct = isMakeSandbox ? 'make' : undefined
  }

  const hasPayloadCloudConfig = payload.config.globals.some(
    (global) => global.slug === 'payload-cloud-instance',
  )

  if (env.PAYLOAD_CLOUD === 'true' && hasPayloadCloudConfig) {
    projectCohorts.push('cloud')
  }

  if (projectCohorts.length === 0) {
    projectCohorts.push('oss')
  }

  return { figmaProduct, projectCohorts }
}
