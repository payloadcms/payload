import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const removeAllowLocalizedWithinLocalized: Transform = {
  name: 'remove-allow-localized-within-localized',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      const compatibilityProps = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => prop.getName() === 'compatibility')

      for (const compatProp of compatibilityProps) {
        const init = compatProp.getInitializer()
        if (!init || !Node.isObjectLiteralExpression(init)) {
          continue
        }

        const allowProp = init.getProperty('allowLocalizedWithinLocalized')
        if (!allowProp) {
          continue
        }

        allowProp.remove()
        mutated = true

        if (init.getProperties().length === 0) {
          compatProp.remove()
        } else {
          notes.push(
            `${sourceFile.getFilePath()}: removed \`allowLocalizedWithinLocalized\` from \`compatibility\`. Other properties remain — review manually.`,
          )
        }
      }

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return {
      filesChanged: [...filesChanged],
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Remove the deprecated `compatibility.allowLocalizedWithinLocalized` flag from Payload configs. Localized-within-localized is now the default behaviour in v4. The entire `compatibility` object is removed if it becomes empty.',
}
