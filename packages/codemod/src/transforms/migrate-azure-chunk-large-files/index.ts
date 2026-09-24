import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const migrateAzureChunkLargeFiles: Transform = {
  name: 'migrate-azure-chunk-large-files',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const azureCalls = sourceFile
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter((call) => {
          const callee = call.getExpression()
          return Node.isIdentifier(callee) && callee.getText() === 'azureStorage'
        })

      for (const call of azureCalls) {
        const [firstArg] = call.getArguments()
        if (!firstArg || !Node.isObjectLiteralExpression(firstArg)) {
          continue
        }

        const clientUploadsProp = firstArg.getProperty('clientUploads')
        if (!clientUploadsProp || !Node.isPropertyAssignment(clientUploadsProp)) {
          continue
        }

        const clientUploadsObject = clientUploadsProp.getInitializerIfKind(
          SyntaxKind.ObjectLiteralExpression,
        )
        if (!clientUploadsObject) {
          continue
        }

        const chunkProp = clientUploadsObject.getProperty('chunkLargeFiles')
        if (!chunkProp || !Node.isPropertyAssignment(chunkProp)) {
          continue
        }

        const wasExplicitlyDisabled = chunkProp.getInitializer()?.getText() === 'false'

        chunkProp.remove()

        // `chunkLargeFiles` was the only option, so collapse `{}` back to `true`.
        if (clientUploadsObject.getProperties().length === 0) {
          clientUploadsProp.setInitializer('true')
        }

        if (wasExplicitlyDisabled) {
          notes.push(
            `${sourceFile.getFilePath()}: removed \`chunkLargeFiles: false\` from an azureStorage call. Chunked client uploads are always on in v4 and can no longer be disabled — update the storage account's CORS to allow the OPTIONS/PUT methods and x-ms-* headers.`,
          )
        }

        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: Array.from(filesChanged), notes: notes.length ? notes : undefined }
  },
  description:
    'Remove the `chunkLargeFiles` option from `azureStorage` `clientUploads` config. Chunked client uploads are the default in v4, so the flag no longer exists; `clientUploads: { chunkLargeFiles: true }` collapses to `clientUploads: true`.',
}
