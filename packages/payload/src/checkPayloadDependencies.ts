import { checkDependencies } from './utilities/dependencies/dependencyChecker.js'
import { PAYLOAD_PACKAGE_LIST } from './versions/payloadPackageList.js'

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
    ],
  })
}
