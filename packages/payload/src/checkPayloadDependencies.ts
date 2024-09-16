import type { CustomVersionParser } from './utilities/dependencies/dependencyChecker.js'

import { checkDependencies } from './utilities/dependencies/dependencyChecker.js'
import { PAYLOAD_PACKAGE_LIST } from './versions/payloadPackageList.js'

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
  const dependencies = [...PAYLOAD_PACKAGE_LIST]

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
