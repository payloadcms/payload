import { Node } from 'ts-morph'

import type { Transform } from '../../types.js'

export const migrateLocalizeStatus: Transform = {
  name: 'migrate-localize-status',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        if (!Node.isPropertyAssignment(node)) {
          return
        }
        if (node.getName() !== 'experimental') {
          return
        }
        const initializer = node.getInitializer()
        if (!initializer || !Node.isObjectLiteralExpression(initializer)) {
          return
        }

        const localizeStatusProp = initializer
          .getProperties()
          .find((prop) => Node.isPropertyAssignment(prop) && prop.getName() === 'localizeStatus')

        if (!localizeStatusProp) {
          return
        }

        localizeStatusProp.remove()
        mutated = true

        // If the experimental object is now empty, remove the experimental property too
        if (initializer.getProperties().length === 0) {
          node.remove()
        }
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Remove experimental.localizeStatus from Payload config. In v4, localizeStatus defaults to true and can be overridden per collection/global with versions.drafts.localizeStatus: false.',
}
