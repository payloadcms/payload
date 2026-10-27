import execa from 'execa'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SbomPackage } from './lib/sbom/formats.js'
import type { ReleaseSbomDeps } from './release-sbom.js'

import { cdx, spdxDoc } from './lib/sbom/fixtures.js'
import { SPDX_ROOT_SUPPLIER } from './lib/sbom/setSpdxRootSupplier.js'
import { runReleaseSbom } from './release-sbom.js'

const VERSION = '4.0.0-beta.3'
const BUNDLE = `payload-sboms-${VERSION}`

const PACKAGES: SbomPackage[] = [
  {
    dependencyNames: ['@payloadcms/translations'],
    name: 'payload',
    packagePath: 'packages/payload',
    version: VERSION,
  },
  {
    dependencyNames: ['@payloadcms/translations'],
    name: '@payloadcms/ui',
    packagePath: 'packages/ui',
    version: VERSION,
  },
]

type FakeDocumentArgs = { format: string; pkg: SbomPackage }

const validDocument = ({ format, pkg }: FakeDocumentArgs): unknown => {
  const options = { dependencyNames: pkg.dependencyNames, name: pkg.name, version: pkg.version }
  return format === 'cyclonedx' ? cdx(options) : spdxDoc(options)
}

/** Mimics `pnpm sbom --split --out <dir>/%s-%v<ext>` with one `--filter` per package. */
const fakePnpm = ({
  makeDocument = validDocument,
  version,
}: {
  makeDocument?: (args: FakeDocumentArgs) => unknown
  version?: string
} = {}) =>
  vi.fn(async ({ args }: { args: string[] }) => {
    const format = args[args.indexOf('--sbom-format') + 1] ?? ''
    const outTemplate = args[args.indexOf('--out') + 1] ?? ''
    const filters = args.flatMap((arg, index) => (args[index - 1] === '--filter' ? [arg] : []))

    for (const filter of filters) {
      const pkg = PACKAGES.find((entry) => `./${entry.packagePath}` === filter)
      if (!pkg) {
        throw new Error(`Unexpected filter ${filter}`)
      }
      const file = outTemplate
        .replace('%s', pkg.name.replace('@', '').replace('/', '-'))
        .replace('%v', version ?? pkg.version)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, JSON.stringify(makeDocument({ format, pkg })))
    }
  })

describe('runReleaseSbom', () => {
  let tempDir: string
  let outDir: string
  let bundleDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-sbom-'))
    outDir = path.join(tempDir, 'sboms')
    bundleDir = path.join(outDir, BUNDLE)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { force: true, recursive: true })
  })

  const makeDeps = (overrides: Partial<ReleaseSbomDeps> = {}) => ({
    getPackages: async () => PACKAGES,
    log: vi.fn(),
    runPnpm: fakePnpm(),
    writeSummary: vi.fn(),
    ...overrides,
  })

  it('should write the bundle folder and its zip', async () => {
    const { fileCount } = await runReleaseSbom({ deps: makeDeps(), outDir })

    expect(fileCount).toBe(4)
    expect(fs.readdirSync(outDir).sort()).toEqual([BUNDLE, `${BUNDLE}.zip`])
    expect(fs.readdirSync(bundleDir).sort()).toEqual([
      'SHA256SUMS',
      'payload-4.0.0-beta.3.cdx.json',
      'payload-4.0.0-beta.3.spdx.json',
      'payloadcms-ui-4.0.0-beta.3.cdx.json',
      'payloadcms-ui-4.0.0-beta.3.spdx.json',
    ])
  })

  it('should zip every SBOM and SHA256SUMS', async () => {
    await runReleaseSbom({ deps: makeDeps(), outDir })

    const { stdout } = await execa('unzip', ['-Z1', path.join(outDir, `${BUNDLE}.zip`)])

    expect(stdout.split('\n').filter((entry) => !entry.endsWith('/'))).toHaveLength(5)
  })

  it('should set the SPDX root supplier', async () => {
    await runReleaseSbom({ deps: makeDeps(), outDir })

    const document = JSON.parse(
      fs.readFileSync(path.join(bundleDir, 'payloadcms-ui-4.0.0-beta.3.spdx.json'), 'utf8'),
    )

    expect(document.packages[0].supplier).toBe(SPDX_ROOT_SUPPLIER)
  })

  it('should write the summary', async () => {
    const deps = makeDeps()

    await runReleaseSbom({ deps, outDir })

    expect(deps.writeSummary).toHaveBeenCalledWith(
      `Generated 4 SBOMs for 2 packages in ${BUNDLE}.zip`,
    )
  })

  it('should throw when the output dir is not empty', async () => {
    fs.mkdirSync(outDir)
    fs.writeFileSync(path.join(outDir, 'stale.cdx.json'), '{}')

    const deps = makeDeps()

    await expect(runReleaseSbom({ deps, outDir })).rejects.toThrow(/not empty/)
    expect(deps.runPnpm).not.toHaveBeenCalled()
  })

  it('should throw before running pnpm when packages have different versions', async () => {
    const [first, second] = PACKAGES
    const deps = makeDeps({
      getPackages: async () => [
        ...(first ? [first] : []),
        ...(second ? [{ ...second, version: '4.0.0-beta.2' }] : []),
      ],
    })

    await expect(runReleaseSbom({ deps, outDir })).rejects.toThrow(
      /4\.0\.0-beta\.2.*4\.0\.0-beta\.3|4\.0\.0-beta\.3.*4\.0\.0-beta\.2/,
    )
    expect(deps.runPnpm).not.toHaveBeenCalled()
  })

  it('should throw listing missing and extra files', async () => {
    const deps = makeDeps({ runPnpm: fakePnpm({ version: '4.0.0-beta.2' }) })

    await expect(runReleaseSbom({ deps, outDir })).rejects.toThrow(
      /missing: payload-4\.0\.0-beta\.3\.cdx\.json.*extra: payload-4\.0\.0-beta\.2\.cdx\.json/s,
    )
  })

  it('should throw with every validation problem and write no zip', async () => {
    const makeDocument = ({ format, pkg }: FakeDocumentArgs) =>
      format === 'cyclonedx'
        ? cdx({
            components: [{ group: '@payloadcms', licenses: [], name: 'translations' }],
            name: pkg.name,
          })
        : validDocument({ format, pkg })
    const deps = makeDeps({ runPnpm: fakePnpm({ makeDocument }) })

    const error = await runReleaseSbom({ deps, outDir }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).toContain(
      'payload (CycloneDX 1.6): @payloadcms/translations has no license',
    )
    expect(String(error)).toContain(
      '@payloadcms/ui (CycloneDX 1.6): @payloadcms/translations has no license',
    )
    expect(fs.existsSync(path.join(outDir, `${BUNDLE}.zip`))).toBe(false)
  })
})
