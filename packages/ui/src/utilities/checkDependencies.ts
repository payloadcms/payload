import { type CustomVersionParser, checkDependencies as payloadCheckDependencies } from 'payload'

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

let checkedDependencies = false

export type CheckDependenciesArgs = Parameters<typeof payloadCheckDependencies>[0]

/**
 * Validates that React/react-dom peer dependencies are aligned. Framework adapters
 * pass `additional` to layer on their own version constraints (e.g. Next.js, Remix).
 *
 * Runs once per process; no-op in production and when `PAYLOAD_DISABLE_DEPENDENCY_CHECKER=true`.
 */
export const checkDependencies = (additional: CheckDependenciesArgs = {}) => {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER === 'true' ||
    checkedDependencies
  ) {
    return
  }

  checkedDependencies = true

  void payloadCheckDependencies({
    dependencyGroups: [
      {
        name: 'react',
        dependencies: ['react', 'react-dom'],
        targetVersionDependency: 'react',
      },
      ...(additional.dependencyGroups ?? []),
    ],
    dependencyVersions: {
      react: {
        customVersionParser: customReactVersionParser,
        required: false,
        version: '>=19.0.0-rc-65a56d0e-20241020',
      },
      'react-dom': {
        customVersionParser: customReactVersionParser,
        required: false,
        version: '>=19.0.0-rc-65a56d0e-20241020',
      },
      ...(additional.dependencyVersions ?? {}),
    },
  })
}
