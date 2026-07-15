import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const propertyName = 'enableListViewSelectAPI'

export const migrateListViewSelectAPI: Transform = {
  name: 'migrate-list-view-select-api',
  apply: ({ project }) => {
    const filesChanged: string[] = []

    for (const file of project.getSourceFiles()) {
      let mutated = false

      for (const property of file.getDescendantsOfKind(SyntaxKind.PropertyAssignment)) {
        if (property.wasForgotten()) {
          continue
        }

        if (property.getName() !== propertyName) {
          continue
        }

        const parent = property.getParent()
        if (!Node.isObjectLiteralExpression(parent)) {
          continue
        }

        const grandParent = parent.getParent()
        if (!Node.isPropertyAssignment(grandParent) || grandParent.getName() !== 'admin') {
          continue
        }

        property.remove()
        mutated = true
      }

      if (mutated) {
        filesChanged.push(file.getFilePath())
      }
    }

    return { filesChanged }
  },
  description:
    "Remove `admin.enableListViewSelectAPI` from Collection Configs. The List View's Select API is the default in v4.",
}
