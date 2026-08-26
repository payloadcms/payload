import type { PackageDetails } from './getPackageDetails.js'

export type PublishResult = {
  details?: string
  name: string
  success: boolean
}

const printSummary = (results: PublishResult[]): void => {
  console.log(`\n\nResults:\n`)
  console.log(
    results
      .map((result) => {
        if (!result.success) {
          console.error(result.details)
          return `  ❌ ${result.name}`
        }
        return `  ✅ ${result.name}`
      })
      .join('\n') + '\n',
  )
}

/**
 * Publishes packages sequentially and stops at the first failure (fail-fast).
 * Combined with a topological publish order, a partial publish always leaves a
 * valid prefix of the dependency graph — no dependent references an unpublished
 * dependency. A re-run resumes safely via publish idempotency.
 */
export const runPublishSequence = async ({
  packages,
  publishOne,
}: {
  packages: PackageDetails[]
  publishOne: (pkg: PackageDetails) => Promise<PublishResult>
}): Promise<PublishResult[]> => {
  const results: PublishResult[] = []

  for (const pkg of packages) {
    const result = await publishOne(pkg)
    results.push(result)

    if (!result.success) {
      printSummary(results)
      throw new Error(
        `Publish failed at ${result.name} (${results.length} of ${packages.length} attempted). ` +
          `Fix and re-run on the same tag to resume.`,
      )
    }
  }

  printSummary(results)
  return results
}
