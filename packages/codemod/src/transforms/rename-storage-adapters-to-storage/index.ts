import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const renameStorageAdaptersToStorage: Transform = {
  name: 'rename-storage-adapters-to-storage',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      const targets = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => prop.getName() === 'storageAdapters')

      for (const prop of targets) {
        if (!Node.isPropertyAssignment(prop)) {
          continue
        }

        const parent = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
        if (!parent) {
          continue
        }

        // If a `storage` property already exists on the same object, skip to avoid collision
        if (parent.getProperty('storage')) {
          continue
        }

        prop.rename('storage')
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: Array.from(filesChanged) }
  },
  description:
    'Rename the top-level `storageAdapters` config property to `storage`. Skips objects that already have a `storage` property.',
}
