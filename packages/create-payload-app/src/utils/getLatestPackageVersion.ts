/**
 * Fetches the latest version of a package from the NPM registry.
 *
 * Used in determining the latest version of Payload to use in the generated templates.
 */
export async function getLatestPackageVersion({
  debug = false,
  packageName = 'payload',
}: {
  debug?: boolean
  /**
   * Package name to fetch the latest version for based on the NPM registry URL
   *
   * Eg. for `'payload'`, it will fetch the version from `https://registry.npmjs.org/payload`
   *
   * @default 'payload'
   */
  packageName?: string
}) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`)
    const data = (await response.json()) as { 'dist-tags': { latest: string } }
    const latestVersion = data['dist-tags'].latest

    if (debug) {
      console.log(`Found latest version of ${packageName}: ${latestVersion}`)
    }

    return latestVersion
  } catch (error) {
    console.error('Error fetching Payload version:', error)
    throw error
  }
}
