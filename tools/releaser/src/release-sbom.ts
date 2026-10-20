/**
 * Writes one CycloneDX 1.6 and one SPDX 2.3 SBOM per published package, plus
 * `SHA256SUMS` and `sbom-manifest.json` (file -> release asset label), to an empty
 * output dir. Fails on any check problem, so a bad SBOM never reaches a release.
 *
 * Usage: pnpm release-sbom --out-dir <absolute dir>
 *
 * SBOMs list the production dependencies Payload builds and tests each package with
 * (repo lockfile); direct peer dependencies are excluded.
 */
import { PROJECT_ROOT } from '@tools/constants'
import execa from 'execa'
import fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import { pathToFileURL } from 'url'

import type { SbomPackage } from './lib/sbom/formats.js'
import type { ReleaseAsset } from './lib/sbom/writeReleaseFiles.js'

import { getPackageDetails } from './lib/getPackageDetails.js'
import { packagePublishList } from './lib/publishList.js'
import { assertPnpmVersion } from './lib/sbom/assertPnpmVersion.js'
import { buildSbomArgs, SBOM_FORMATS, toSbomFileName, toSbomLabel } from './lib/sbom/formats.js'
import { setSpdxRootSupplier } from './lib/sbom/setSpdxRootSupplier.js'
import { validateSbom } from './lib/sbom/validateSbom.js'
import { writeReleaseFiles } from './lib/sbom/writeReleaseFiles.js'
import { writeStepSummary } from './lib/writeStepSummary.js'

export type ReleaseSbomDeps = {
  getPackages: () => Promise<SbomPackage[]>
  getPnpmVersion: () => Promise<string>
  log: (message: string) => void
  runPnpm: (args: { args: string[] }) => Promise<void>
  writeSummary: (markdown: string) => void
}

export const runReleaseSbom = async ({
  deps,
  outDir,
}: {
  deps: ReleaseSbomDeps
  outDir: string
}): Promise<{ fileCount: number }> => {
  const { getPackages, getPnpmVersion, log, runPnpm, writeSummary } = deps

  assertPnpmVersion({ version: await getPnpmVersion() })

  // pnpm overwrites only the files it writes; anything else left here would ship.
  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
    throw new Error(`Output dir ${outDir} is not empty`)
  }
  fs.mkdirSync(outDir, { recursive: true })

  const packages = await getPackages()

  for (const format of SBOM_FORMATS) {
    log(`Generating ${format.labelSuffix} SBOMs for ${packages.length} packages`)
    await runPnpm({ args: buildSbomArgs({ format, outDir, packages }) })
  }

  const expected = packages.flatMap((pkg) =>
    SBOM_FORMATS.map((format) => ({
      file: toSbomFileName({ format, name: pkg.name, version: pkg.version }),
      format,
      pkg,
    })),
  )
  assertFileSet({ actual: fs.readdirSync(outDir), expected: expected.map(({ file }) => file) })

  const problems: string[] = []
  for (const { file, format, pkg } of expected) {
    const filePath = path.join(outDir, file)
    const document: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const fileProblems = validateSbom({ document, format, pkg })
    problems.push(...fileProblems)

    if (format.id === 'spdx' && fileProblems.length === 0) {
      fs.writeFileSync(filePath, JSON.stringify(setSpdxRootSupplier({ document }), null, 2) + '\n')
    }
  }
  if (problems.length > 0) {
    throw new Error(`SBOM checks failed:\n${problems.join('\n')}`)
  }

  const assets: ReleaseAsset[] = expected.map(({ file, format, pkg }) => ({
    file,
    label: toSbomLabel({ format, name: pkg.name }),
  }))
  writeReleaseFiles({ assets, outDir })

  const summary = `Generated ${assets.length} SBOMs for ${packages.length} packages`
  log(`${summary} in ${outDir}`)
  writeSummary(summary)

  return { fileCount: assets.length }
}

async function main(): Promise<void> {
  const argv = minimist(process.argv.slice(2), { string: ['out-dir'] })
  const outDir: unknown = argv['out-dir']
  // `pnpm --filter` runs this from tools/releaser, so a relative path would not mean what the caller typed.
  if (typeof outDir !== 'string' || !path.isAbsolute(outDir)) {
    throw new Error('Usage: pnpm release-sbom --out-dir <absolute dir>')
  }

  await runReleaseSbom({
    deps: {
      getPackages,
      getPnpmVersion: async () => (await execa('pnpm', ['--version'])).stdout.trim(),
      log: console.log,
      runPnpm: async ({ args }) => {
        await execa('pnpm', args, { cwd: PROJECT_ROOT, stdio: 'inherit' })
      },
      writeSummary: (markdown) =>
        writeStepSummary({ markdown, summaryPath: process.env.GITHUB_STEP_SUMMARY }),
    },
    outDir,
  })
}

function assertFileSet({ actual, expected }: { actual: string[]; expected: string[] }): void {
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)
  const missing = expected.filter((file) => !actualSet.has(file))
  const extra = actual.filter((file) => !expectedSet.has(file))
  if (missing.length === 0 && extra.length === 0) {
    return
  }

  throw new Error(
    `pnpm sbom wrote an unexpected file set.\nmissing: ${missing.join(', ') || '(none)'}\nextra: ${extra.join(', ') || '(none)'}`,
  )
}

async function getPackages(): Promise<SbomPackage[]> {
  const details = await getPackageDetails(packagePublishList)
  return details.map(({ name, packagePath, version }) => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, packagePath, 'package.json'), 'utf8'),
    )
    return {
      dependencyNames: Object.keys(packageJson.dependencies ?? {}),
      name,
      packagePath,
      version,
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
