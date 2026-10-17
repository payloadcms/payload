import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const removeStrictDraftTypes: Transform = {
  name: 'remove-strict-draft-types',
  apply: ({ project }) => {
    const filesChanged: string[] = []

    for (const file of project.getSourceFiles()) {
      let hasChanged = false

      for (const object of file.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
        if (object.wasForgotten()) {
          continue
        }

        const parent = object.getParent()

        if (!Node.isPropertyAssignment(parent)) {
          continue
        }

        const name = parent.getNameNode()
        const propertyName = Node.isStringLiteral(name) ? name.getLiteralText() : name.getText()

        if (propertyName !== 'typescript') {
          continue
        }

        for (const property of object.getProperties()) {
          if (
            !Node.isPropertyAssignment(property) &&
            !Node.isShorthandPropertyAssignment(property)
          ) {
            continue
          }

          const name = property.getNameNode()
          const propertyName = Node.isStringLiteral(name) ? name.getLiteralText() : name.getText()

          if (propertyName === 'strictDraftTypes') {
            property.remove()
            hasChanged = true
          }
        }
      }

      if (hasChanged) {
        filesChanged.push(file.getFilePath())
      }
    }

    return { filesChanged }
  },
  description: 'Remove `typescript.strictDraftTypes`. Strict draft types are always enabled in v4.',
}
