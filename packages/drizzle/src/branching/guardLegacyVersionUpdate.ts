import type { Where } from 'payload'

/** Managed snapshots can only change through the native branch CAS boundary. */
export const guardLegacyVersionUpdate = ({
  isBranchStorage,
  versionData,
  where,
}: {
  isBranchStorage: boolean
  versionData: Record<string, unknown>
  where: Where
}): { versionData: Record<string, unknown>; where: Where } => {
  if (!isBranchStorage) {
    return { versionData, where }
  }

  if (
    ['branchGeneration', 'branchFrozen', 'branchOwnerKey', 'branchOnly'].some(
      (key) => key in versionData,
    )
  ) {
    throw new Error('Branch version metadata can only be changed through the branching adapter.')
  }

  if (Object.keys(versionData).length === 1 && typeof versionData.latest === 'boolean') {
    return { versionData, where }
  }

  return {
    // Keep a root assignment even when all document changes live in nested tables.
    versionData: { ...versionData, branchGeneration: null },
    where: { and: [where, { branchGeneration: { exists: false } }] },
  }
}
