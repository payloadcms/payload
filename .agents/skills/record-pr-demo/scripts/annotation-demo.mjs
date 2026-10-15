export function createAnnotationInteraction({ presentation }) {
  if (!presentation) throw new Error('Annotations require recording chrome')
  return {
    hideAnnotation: presentation.clearAnnotation,
    showAnnotation: async (options) => {
      if (!options || typeof options !== 'object') {
        throw new Error('Annotations require title and body')
      }
      if (['type', 'position', 'width'].some((key) => key in options)) {
        throw new Error('Annotations always use the chrome panel; remove type, position, and width')
      }
      const { body, index = 1, total = 1, title } = options
      await presentation.setAnnotation({ body, index, total, title })
    },
  }
}
