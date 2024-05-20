export const isEditing = ({
  id,
  collectionSlug,
  globalSlug,
}: {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
}): boolean => Boolean(globalSlug || (collectionSlug && !!id))
