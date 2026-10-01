import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const storageFactoryByPackage = new Map([
  ['@payloadcms/plugin-cloud-storage', 'cloudStoragePlugin'],
  ['@payloadcms/storage-azure', 'azureStorage'],
  ['@payloadcms/storage-gcs', 'gcsStorage'],
  ['@payloadcms/storage-r2', 'r2Storage'],
  ['@payloadcms/storage-s3', 's3Storage'],
  ['@payloadcms/storage-vercel-blob', 'vercelBlobStorage'],
])

export const removeStorageAlwaysInsertFields: Transform = {
  name: 'remove-storage-always-insert-fields',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      for (const importDeclaration of sourceFile.getImportDeclarations()) {
        const storageFactoryName = storageFactoryByPackage.get(
          importDeclaration.getModuleSpecifierValue(),
        )

        if (!storageFactoryName) {
          continue
        }

        const storageFactoryImport = importDeclaration
          .getNamedImports()
          .find((namedImport) => namedImport.getName() === storageFactoryName)

        if (!storageFactoryImport) {
          continue
        }

        const localStorageFactoryName =
          storageFactoryImport.getAliasNode() ?? storageFactoryImport.getNameNode()

        for (const reference of localStorageFactoryName.findReferencesAsNodes()) {
          const call = reference.getParentIfKind(SyntaxKind.CallExpression)

          if (!call || call.getExpression() !== reference) {
            continue
          }

          const [options] = call.getArguments()

          if (!options || !Node.isObjectLiteralExpression(options)) {
            continue
          }

          if (options.getProperties().some((property) => Node.isSpreadAssignment(property))) {
            continue
          }

          const alwaysInsertFieldsProperty = options.getProperty('alwaysInsertFields')

          if (!alwaysInsertFieldsProperty) {
            continue
          }

          alwaysInsertFieldsProperty.remove()
          filesChanged.add(sourceFile.getFilePath())
        }
      }
    }

    return { filesChanged: Array.from(filesChanged) }
  },
  description:
    'Remove the obsolete `alwaysInsertFields` option from cloud storage plugin and storage adapter configs. The prefix field is now always inserted.',
}
