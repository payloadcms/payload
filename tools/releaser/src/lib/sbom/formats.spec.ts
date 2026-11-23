import type { SbomFormat, SbomPackage } from './formats.js'

import { describe, expect, it } from 'vitest'

import { buildSbomArgs, SBOM_FORMATS, toSbomFileName } from './formats.js'

const getFormat = (id: SbomFormat['id']): SbomFormat => {
  const format = SBOM_FORMATS.find((entry) => entry.id === id)
  if (!format) {
    throw new Error(`Unknown format ${id}`)
  }
  return format
}

const cyclonedx = getFormat('cyclonedx')
const spdx = getFormat('spdx')

const pkg = (dir: string): SbomPackage => ({
  dependencyNames: [],
  name: dir,
  packagePath: `packages/${dir}`,
  version: '4.0.0-beta.3',
})

describe('SBOM_FORMATS', () => {
  it('should list CycloneDX before SPDX', () => {
    expect(SBOM_FORMATS.map((format) => format.id)).toEqual(['cyclonedx', 'spdx'])
  })
})

describe('toSbomFileName', () => {
  it('should drop the scope @ and replace / with -', () => {
    expect(
      toSbomFileName({
        format: cyclonedx,
        name: '@payloadcms/db-postgres',
        version: '4.0.0-beta.3',
      }),
    ).toBe('payloadcms-db-postgres-4.0.0-beta.3.cdx.json')
  })

  it('should keep unscoped names', () => {
    expect(toSbomFileName({ format: spdx, name: 'payload', version: '4.0.0-beta.3' })).toBe(
      'payload-4.0.0-beta.3.spdx.json',
    )
  })
})

describe('buildSbomArgs', () => {
  it('should build one split call with a filter per package', () => {
    expect(
      buildSbomArgs({ format: cyclonedx, outDir: '/out', packages: [pkg('payload'), pkg('ui')] }),
    ).toEqual([
      'sbom',
      '--filter',
      './packages/payload',
      '--filter',
      './packages/ui',
      '--prod',
      '--exclude-peers',
      '--sbom-type',
      'library',
      '--sbom-supplier',
      'Payload CMS, LLC',
      '--sbom-format',
      'cyclonedx',
      '--sbom-spec-version',
      '1.6',
      '--split',
      '--out',
      '/out/%s-%v.cdx.json',
    ])
  })

  it('should use spdx flags and extension for spdx', () => {
    const args = buildSbomArgs({ format: spdx, outDir: '/out', packages: [pkg('payload')] })

    expect(args).toContain('spdx')
    expect(args).not.toContain('--sbom-spec-version')
    expect(args.at(-1)).toBe('/out/%s-%v.spdx.json')
  })
})
