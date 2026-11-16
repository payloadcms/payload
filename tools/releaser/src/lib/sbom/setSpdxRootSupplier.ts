import type { SpdxDocument } from './validateSbom.js'

import { findSpdxRoot, isSpdxDocument } from './validateSbom.js'

export const SPDX_ROOT_SUPPLIER = 'Organization: Payload CMS, LLC'

/**
 * pnpm ignores `--sbom-supplier` for SPDX and fills the root supplier from the
 * package `author`. Set it to the same organization the CycloneDX SBOM names.
 */
export const setSpdxRootSupplier = ({ document }: { document: unknown }): SpdxDocument => {
  if (!isSpdxDocument(document)) {
    throw new Error('Cannot set supplier: not an SPDX document')
  }

  const root = findSpdxRoot(document)
  if (!root) {
    throw new Error('Cannot set supplier: SPDX document has no DESCRIBES root package')
  }

  return {
    ...document,
    packages: document.packages.map((spdxPackage) =>
      spdxPackage === root ? { ...spdxPackage, supplier: SPDX_ROOT_SUPPLIER } : spdxPackage,
    ),
  }
}
