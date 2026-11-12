/**
 * Bin for `pnpm --filter releaser list-publish-names`: prints the npm name of each
 * published package, one per line, in publish order. Feeds the npm trust setup loop.
 */
import { getPackageDetails } from './lib/getPackageDetails.js'
import { packagePublishList } from './lib/publishList.js'

getPackageDetails(packagePublishList)
  .then((packages) => console.log(packages.map((pkg) => pkg.name).join('\n')))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
