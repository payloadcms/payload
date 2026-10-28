import { describe, expect, it } from 'vitest'

import { spdxDoc } from './fixtures.js'
import { setSpdxRootSupplier, SPDX_ROOT_SUPPLIER } from './setSpdxRootSupplier.js'

describe('setSpdxRootSupplier', () => {
  it('should set supplier on the DESCRIBES target only', () => {
    const result = setSpdxRootSupplier({ document: spdxDoc() })

    expect(result.packages.find((p) => p.SPDXID === 'SPDXRef-RootPackage')?.supplier).toBe(
      'Organization: Payload CMS, LLC',
    )
    expect(result.packages.find((p) => p.name === '@payloadcms/ui')?.supplier).toBe(
      'Person: Payload <dev@payloadcms.com> (https://payloadcms.com)',
    )
  })

  it('should keep the other root package fields', () => {
    const result = setSpdxRootSupplier({ document: spdxDoc() })

    expect(result.packages[0]).toMatchObject({
      licenseDeclared: 'MIT',
      supplier: SPDX_ROOT_SUPPLIER,
      versionInfo: '4.0.0-beta.3',
    })
  })

  it('should not change the input document', () => {
    const document = spdxDoc()

    setSpdxRootSupplier({ document })

    expect(document.packages[0]?.supplier).toMatch(/^Person: /)
  })

  it('should throw when there is no DESCRIBES relationship', () => {
    expect(() => setSpdxRootSupplier({ document: spdxDoc({ hasDescribes: false }) })).toThrow(
      /root/,
    )
  })

  it('should throw when the document is not SPDX', () => {
    expect(() => setSpdxRootSupplier({ document: {} })).toThrow(/SPDX/)
  })
})
