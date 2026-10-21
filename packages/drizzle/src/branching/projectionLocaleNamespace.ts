import type { SanitizedCollectionConfig, SanitizedConfig } from 'payload'

/** Dots cannot occur in Payload data field names, including flattened group paths. */
export const branchProjectionLocaleKey = '__payload.branchKey'

export const isRegisteredBranchProjection = ({
  collection,
  config,
}: {
  collection: SanitizedCollectionConfig
  config: SanitizedConfig
}): boolean => {
  const descriptor = collection.custom?.branchProjectionStorage
  const hasCollection = typeof descriptor?.collection === 'string'
  const hasGlobal = typeof descriptor?.global === 'string'

  if (hasCollection === hasGlobal) {
    return false
  }

  const source = hasCollection
    ? config.collections.find(({ slug }) => slug === descriptor.collection)
    : config.globals.find(({ slug }) => slug === descriptor.global)
  const metadata = collection.flattenedFields.find(({ name }) => name === '_branchProjection')

  return (
    source?.custom?.branchQueryStorage?.projection === collection.slug &&
    metadata?.type === 'group' &&
    !metadata.localized &&
    metadata.flattenedFields.some(
      (field) => field.name === 'branchKey' && field.type === 'text' && field.required === true,
    )
  )
}
