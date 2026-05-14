import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const removeStrictDraftTypes: Transform = {
  name: 'remove-strict-draft-types',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      const typescriptProps = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => prop.getName() === 'typescript')

      for (const tsProp of typescriptProps) {
        const init = tsProp.getInitializer()
        if (!init || !Node.isObjectLiteralExpression(init)) {
          continue
        }

        const strictProp = init.getProperty('strictDraftTypes')
        if (!strictProp) {
          continue
        }

        strictProp.remove()
        mutated = true

        if (init.getProperties().length === 0) {
          tsProp.remove()
        }
      }

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Remove the `typescript.strictDraftTypes` option from Payload configs. Strict draft types are now the default behaviour in v4 and the flag no longer exists. The entire `typescript` object is removed if it becomes empty.',
}
