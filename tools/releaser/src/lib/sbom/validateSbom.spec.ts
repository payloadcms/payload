import type { SbomFormat, SbomPackage } from './formats.js'

import { describe, expect, it } from 'vitest'

import { cdx, spdxDoc } from './fixtures.js'
import { SBOM_FORMATS } from './formats.js'
import { validateSbom } from './validateSbom.js'

const getFormat = (id: SbomFormat['id']): SbomFormat => {
  const format = SBOM_FORMATS.find((entry) => entry.id === id)
  if (!format) {
    throw new Error(`Unknown format ${id}`)
  }
  return format
}

const cyclonedx = getFormat('cyclonedx')
const spdx = getFormat('spdx')

const pkg: SbomPackage = {
  dependencyNames: ['@payloadcms/ui'],
  name: '@payloadcms/next',
  packagePath: 'packages/next',
  version: '4.0.0-beta.3',
}

describe('validateSbom (CycloneDX)', () => {
  it('should return no problems for a valid CycloneDX bom', () => {
    expect(validateSbom({ document: cdx(), format: cyclonedx, pkg })).toEqual([])
  })

  it('should report a component without license', () => {
    expect(
      validateSbom({
        document: cdx({ components: [{ group: '@payloadcms', licenses: [], name: 'ui' }] }),
        format: cyclonedx,
        pkg,
      }),
    ).toEqual(['@payloadcms/next (CycloneDX 1.6): @payloadcms/ui has no license'])
  })

  it('should report a missing direct dependency', () => {
    expect(validateSbom({ document: cdx({ components: [] }), format: cyclonedx, pkg })).toEqual([
      '@payloadcms/next (CycloneDX 1.6): direct dependency @payloadcms/ui missing',
    ])
  })

  it('should report a wrong spec version', () => {
    expect(
      validateSbom({ document: cdx({ specVersion: '1.7' }), format: cyclonedx, pkg }),
    ).toContain('@payloadcms/next (CycloneDX 1.6): specVersion is 1.7, expected 1.6')
  })

  it('should report a root name mismatch', () => {
    expect(
      validateSbom({ document: cdx({ name: '@payloadcms/ui' }), format: cyclonedx, pkg }),
    ).toContain(
      '@payloadcms/next (CycloneDX 1.6): root is @payloadcms/ui, expected @payloadcms/next',
    )
  })

  it('should report a non-object document as one problem', () => {
    expect(validateSbom({ document: 'oops', format: cyclonedx, pkg })).toEqual([
      '@payloadcms/next (CycloneDX 1.6): not a CycloneDX document',
    ])
  })
})

describe('validateSbom (SPDX)', () => {
  it('should return no problems for a valid SPDX document', () => {
    expect(validateSbom({ document: spdxDoc(), format: spdx, pkg })).toEqual([])
  })

  it('should report NOASSERTION license in SPDX', () => {
    expect(
      validateSbom({ document: spdxDoc({ dependencyLicense: 'NOASSERTION' }), format: spdx, pkg }),
    ).toEqual(['@payloadcms/next (SPDX 2.3): @payloadcms/ui has no license'])
  })

  it('should report a missing direct dependency', () => {
    expect(validateSbom({ document: spdxDoc({ dependencyNames: [] }), format: spdx, pkg })).toEqual(
      ['@payloadcms/next (SPDX 2.3): direct dependency @payloadcms/ui missing'],
    )
  })

  it('should report a root name mismatch', () => {
    expect(
      validateSbom({ document: spdxDoc({ name: '@payloadcms/ui' }), format: spdx, pkg }),
    ).toContain('@payloadcms/next (SPDX 2.3): root is @payloadcms/ui, expected @payloadcms/next')
  })

  it('should report a missing root', () => {
    expect(
      validateSbom({ document: spdxDoc({ hasDescribes: false }), format: spdx, pkg }),
    ).toContain('@payloadcms/next (SPDX 2.3): no root package (DESCRIBES relationship)')
  })

  it('should report a non-object document as one problem', () => {
    expect(validateSbom({ document: null, format: spdx, pkg })).toEqual([
      '@payloadcms/next (SPDX 2.3): not an SPDX 2.3 document',
    ])
  })
})
