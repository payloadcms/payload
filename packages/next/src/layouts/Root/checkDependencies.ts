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

export const checkDependencies = () => {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER !== 'true' &&
    !checkedDependencies
  ) {
    checkedDependencies = true

    // First check if there are mismatching dependency versions of next / react packages
    void payloadCheckDependencies({
      dependencyGroups: [
        {
          name: 'react',
          dependencies: ['react', 'react-dom'],
          targetVersionDependency: 'react',
        },
      ],
      dependencyVersions: {
        next: {
          required: false,
          version: '>=15.0.0',
        },
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
      },
    })
  }
}
