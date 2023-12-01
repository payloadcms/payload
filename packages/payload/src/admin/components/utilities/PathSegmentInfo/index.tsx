export const getPathSegmentInfo = (pathSegments, segmentName, segmentsNeededForEditView = 2) => {
  const index = pathSegments.indexOf(segmentName)
  const slug = index !== -1 ? pathSegments[index + 1] : null
  const isEditView = index !== -1 && pathSegments.length > index + segmentsNeededForEditView

  return { isEditView, slug }
}
