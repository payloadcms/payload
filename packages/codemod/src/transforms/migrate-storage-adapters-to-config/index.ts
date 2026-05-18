import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const STORAGE_ADAPTER_FACTORIES = new Set([
  'azureStorage',
  'gcsStorage',
  'r2Storage',
  's3Storage',
  'uploadthingStorage',
  'vercelBlobStorage',
])

export const migrateStorageAdaptersToConfig: Transform = {
  name: 'migrate-storage-adapters-to-config',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      const objectsWithPlugins = sourceFile
        .getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)
        .filter((obj) => Boolean(obj.getProperty('plugins')))

      for (const obj of objectsWithPlugins) {
        const pluginsProp = obj.getProperty('plugins')
        if (!pluginsProp || !Node.isPropertyAssignment(pluginsProp)) {
          continue
        }

        const arrayLiteral = pluginsProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
        if (!arrayLiteral) {
          continue
        }

        const elements = arrayLiteral.getElements()
        const storageIndices: number[] = []
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i]
          if (!Node.isCallExpression(el)) {
            continue
          }
          const callee = el.getExpression()
          if (Node.isIdentifier(callee) && STORAGE_ADAPTER_FACTORIES.has(callee.getText())) {
            storageIndices.push(i)
          }
        }

        if (storageIndices.length === 0) {
          continue
        }

        // Capture re-emitted text (context-free, clean indentation) before removal
        const storageTexts = storageIndices.map((i) => arrayLiteral.getElements()[i]!.print())

        // Remove storage adapter elements from plugins (high-to-low to preserve indices)
        for (const i of [...storageIndices].reverse()) {
          arrayLiteral.removeElement(i)
        }

        // Remove plugins entirely if it is now empty
        if (arrayLiteral.getElements().length === 0) {
          pluginsProp.remove()
        }

        // Append to existing storage or create it
        const existingProp = obj.getProperty('storage')
        if (existingProp && Node.isPropertyAssignment(existingProp)) {
          const arr = existingProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
          if (arr) {
            for (const text of storageTexts) {
              arr.addElement(text)
            }
          }
        } else {
          const added = obj.addPropertyAssignment({ name: 'storage', initializer: '[]' })
          const arr = added.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
          for (const text of storageTexts) {
            arr.addElement(text)
          }
        }

        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: Array.from(filesChanged) }
  },
  description:
    'Move storage adapter factory calls (s3Storage, gcsStorage, azureStorage, r2Storage, vercelBlobStorage, uploadthingStorage) from `plugins` to the top-level `storage` array. Removes `plugins` if it becomes empty after the move.',
}
