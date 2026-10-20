import path from 'path'

export type SbomFormat = {
  /** File extension, including the leading dot */
  extension: '.cdx.json' | '.spdx.json'
  /** `pnpm sbom` flags that select this format */
  flags: string[]
  id: 'cyclonedx' | 'spdx'
  /** Format name and version, used to prefix check problems */
  labelSuffix: 'CycloneDX 1.6' | 'SPDX 2.3'
}

export type SbomPackage = {
  /** Keys of `dependencies` in the package's package.json */
  dependencyNames: string[]
  /** npm name, e.g. `@payloadcms/db-postgres` */
  name: string
  packagePath: `packages/${string}`
  version: string
}

// pnpm fixes SPDX at 2.3. CycloneDX 1.6 because Snyk, FOSSA and older Dependency-Track reject 1.7.
export const SBOM_FORMATS: readonly SbomFormat[] = [
  {
    extension: '.cdx.json',
    flags: ['--sbom-format', 'cyclonedx', '--sbom-spec-version', '1.6'],
    id: 'cyclonedx',
    labelSuffix: 'CycloneDX 1.6',
  },
  {
    extension: '.spdx.json',
    flags: ['--sbom-format', 'spdx'],
    id: 'spdx',
    labelSuffix: 'SPDX 2.3',
  },
]

const COMMON_FLAGS = [
  '--prod',
  // Peers are provided by the consumer's project, not by the package.
  '--exclude-peers',
  '--sbom-type',
  'library',
  '--sbom-supplier',
  'Payload CMS, LLC',
]

/** Same shape as pnpm's `%s-%v` output name: `@a/b` -> `a-b`. */
export const toSbomFileName = ({
  format,
  name,
  version,
}: {
  format: SbomFormat
  name: string
  version: string
}): string => `${name.replace(/^@/, '').replace('/', '-')}-${version}${format.extension}`

/** Args for one `pnpm sbom --split` call that writes one file per package. */
export const buildSbomArgs = ({
  format,
  outDir,
  packages,
}: {
  format: SbomFormat
  outDir: string
  packages: SbomPackage[]
}): string[] => [
  'sbom',
  ...packages.flatMap((pkg) => ['--filter', `./${pkg.packagePath}`]),
  ...COMMON_FLAGS,
  ...format.flags,
  '--split',
  '--out',
  path.join(outDir, `%s-%v${format.extension}`),
]
