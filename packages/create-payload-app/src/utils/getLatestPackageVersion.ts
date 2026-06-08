/**
 * Fetches the version of a package published under the given npm dist-tag.
 *
 * Used to determine which version of Payload to pin in generated templates.
 */
export async function getLatestPackageVersion({
  debug = false,
  packageName = 'payload',
  tag = 'latest',
}: {
  debug?: boolean
  /**
   * Package name to resolve, based on the NPM registry URL.
   *
   * Eg. for `'payload'`, fetches
   * `https://registry.npmjs.org/-/package/payload/dist-tags`
   *
   * @default 'payload'
   */
  packageName?: string
  /**
   * The npm dist-tag to resolve to a concrete version.
   *
   * @default 'latest'
   */
  tag?: string
}): Promise<string> {
  try {
    const response = await fetch(`https://registry.npmjs.org/-/package/${packageName}/dist-tags`)
    const data = (await response.json()) as Record<string, string>
    const version = data?.[tag]

    if (!version || typeof version !== 'string') {
      throw new Error(`No "${tag}" release found for package: ${packageName}`)
    }

    if (debug) {
      console.log(`Found ${tag} version of ${packageName}: ${version}`)
    }

    return version
  } catch (error) {
    console.error('Error fetching Payload version:', error)
    throw error
  }
}
