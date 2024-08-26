import type { CustomVersionParser } from './utilities/dependencies/dependencyChecker.js'

import { checkDependencies } from './utilities/dependencies/dependencyChecker.js'

const customReactVersionParser: CustomVersionParser = (version) => {
  const [mainVersion, ...preReleases] = version.split('-')

  if (preReleases?.length === 3) {
    // Needs different handling, as it's in a format like 19.0.0-rc-06d0b89e-20240801 format
    const date = preReleases[2]

    const parts = mainVersion.split('.').map(Number)
    return { parts, preReleases: [date] }
  }

  const parts = mainVersion.split('.').map(Number)
  return { parts, preReleases }
}

export async function checkPayloadDependencies() {
  const dependencies = [
    '@payloadcms/ui/shared',
    'payload',
    '@payloadcms/next/utilities',
    '@payloadcms/richtext-lexical',
    '@payloadcms/richtext-slate',
    '@payloadcms/graphql',
    '@payloadcms/plugin-cloud',
    '@payloadcms/db-mongodb',
    '@payloadcms/db-postgres',
    '@payloadcms/plugin-form-builder',
    '@payloadcms/plugin-nested-docs',
    '@payloadcms/plugin-seo',
    '@payloadcms/plugin-search',
    '@payloadcms/plugin-cloud-storage',
    '@payloadcms/plugin-stripe',
    '@payloadcms/plugin-zapier',
    '@payloadcms/plugin-redirects',
    '@payloadcms/bundler-webpack',
    '@payloadcms/bundler-vite',
    '@payloadcms/live-preview',
    '@payloadcms/live-preview-react',
    '@payloadcms/translations',
    '@payloadcms/email-nodemailer',
    '@payloadcms/email-resend',
    '@payloadcms/storage-azure',
    '@payloadcms/storage-s3',
    '@payloadcms/storage-gcs',
    '@payloadcms/storage-vercel-blob',
    '@payloadcms/storage-uploadthing',
  ]

  if (process.env.PAYLOAD_CI_DEPENDENCY_CHECKER !== 'true') {
    dependencies.push('@payloadcms/plugin-sentry')
  }

  // First load. First check if there are mismatching dependency versions of payload packages
  await checkDependencies({
    dependencyGroups: [
      {
        name: 'payload',
        dependencies,
        targetVersionDependency: 'payload',
      },
      {
        name: 'react',
        dependencies: ['react', 'react-dom'],
        targetVersionDependency: 'react',
      },
    ],
    dependencyVersions: {
      next: {
        required: false,
        version: '>=15.0.0-canary.104',
      },
      react: {
        customVersionParser: customReactVersionParser,
        required: false,
        version: '>=19.0.0-rc-06d0b89e-20240801',
      },
      'react-dom': {
        customVersionParser: customReactVersionParser,
        required: false,
        version: '>=19.0.0-rc-06d0b89e-20240801',
      },
    },
  })
}
