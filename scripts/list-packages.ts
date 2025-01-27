import { getPackageDetails, showPackageDetails } from './lib/getPackageDetails'

async function main() {
  const packageDetails = await getPackageDetails()
  showPackageDetails(packageDetails)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
