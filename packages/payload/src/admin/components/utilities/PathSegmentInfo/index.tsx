export const getPathSegmentInfo = (pathSegments, segmentName) => {
  const index = pathSegments.indexOf(segmentName)
  const isGlobal = segmentName === 'globals'
  const slug = index !== -1 ? pathSegments[index + 1] : null

  const isAPIView = pathSegments.includes('api')
  const isListView = !isGlobal && index !== -1 && pathSegments.length === index + 2
  const isEditView =
    index !== -1 &&
    ((isGlobal && !isAPIView && pathSegments.length === index + 2) ||
      (!isGlobal && !isAPIView && pathSegments.length === index + 3))

  const versionsIndex = pathSegments.indexOf('versions')
  const isVersionsView = versionsIndex !== -1 && versionsIndex === pathSegments.length - 1
  const isVersionView = versionsIndex !== -1 && versionsIndex < pathSegments.length - 1
  const isLivePreviewView = pathSegments.includes('preview')

  return {
    isAPIView,
    isEditView,
    isListView,
    isLivePreviewView,
    isVersionView,
    isVersionsView,
    slug,
  }
}
