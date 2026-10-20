export function createAnnotationInteraction({ presentation }) {
  if (!presentation) throw new Error('Annotations require recording chrome')
  let hasUsedAnnotations = false
  let isAnnotationVisible = false
  let isReady = false
  let hasOpeningAnnotation = false
  const openingAnnotationError = 'Show an initial annotation before ready() when using annotations.'
  return {
    markReady: () => {
      if (hasUsedAnnotations && !isAnnotationVisible) throw new Error(openingAnnotationError)
      hasOpeningAnnotation = isAnnotationVisible
      isReady = true
    },
    hideAnnotation: async () => {
      await presentation.clearAnnotation()
      isAnnotationVisible = false
    },
    showAnnotation: async (options) => {
      if (!options || typeof options !== 'object') {
        throw new Error('Annotations require title and body')
      }
      if (['type', 'position', 'width'].some((key) => key in options)) {
        throw new Error('Annotations always use the chrome panel; remove type, position, and width')
      }
      if (isReady && !hasOpeningAnnotation) throw new Error(openingAnnotationError)
      const { body, index = 1, total = 1, title } = options
      await presentation.setAnnotation({ body, index, total, title })
      hasUsedAnnotations = true
      isAnnotationVisible = true
    },
  }
}
