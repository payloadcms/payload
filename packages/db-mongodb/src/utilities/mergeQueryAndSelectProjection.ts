/**
 * `queryProjection` - project with false values.
 * `selectProjection` contains only true values
 */
export const mergeQueryAndSelectProjection = ({
  queryProjection,
  selectProjection,
}: {
  queryProjection: Record<string, boolean>
  selectProjection?: Record<string, true>
}): Record<string, boolean> | undefined => {
  if (!selectProjection) {
    if (Object.keys(queryProjection).length > 0) {
      return queryProjection
    }
    return
  }

  return selectProjection
}
