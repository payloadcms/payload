/** Strip only private envelope metadata; similarly named user document fields stay inside version. */
export const serializeLegacyVersion = <T extends Record<string, unknown>>({
  entity,
  version,
}: {
  entity: { custom?: Record<string, unknown> }
  version: T
}): T => {
  if (!entity.custom?.branchStorage) {
    return version
  }

  const serialized = { ...version }

  for (const key of ['branchGeneration', 'branchFrozen', 'branchOwnerKey', 'branchOnly']) {
    delete serialized[key]
  }

  return serialized
}
