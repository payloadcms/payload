import type { SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const PAYLOAD_LAYOUTS_IMPORT = '@payloadcms/next/layouts'

export const migrateNextGenerateViewportExport: Transform = {
  name: 'migrate-next-generate-viewport-export',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      if (!isAppLayoutFile(sourceFile.getFilePath())) {
        continue
      }

      if (!hasPayloadLayoutsImport(sourceFile)) {
        continue
      }

      if (
        hasGenerateViewportExport(sourceFile) ||
        hasLocalGenerateViewportDeclaration(sourceFile)
      ) {
        continue
      }

      const payloadLayoutsImport = getPayloadLayoutsImport(sourceFile)
      if (!payloadLayoutsImport) {
        continue
      }

      payloadLayoutsImport.insertNamedImport(0, 'generatePayloadViewport')

      const lastImport = sourceFile.getImportDeclarations().at(-1)
      if (!lastImport) {
        continue
      }

      const lastImportEnd = lastImport.getEnd()

      sourceFile.insertText(
        lastImportEnd,
        `\n\nexport const generateViewport = generatePayloadViewport`,
      )
      filesChanged.add(sourceFile.getFilePath())
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    "Adds a `generateViewport` export to app router layout files that already use Payload's shared Next.js layout, preserving Next.js viewport behavior without touching custom viewport implementations.",
}

function hasPayloadLayoutsImport(sourceFile: SourceFile): boolean {
  return Boolean(getPayloadLayoutsImport(sourceFile))
}

function getPayloadLayoutsImport(sourceFile: SourceFile) {
  return sourceFile.getImportDeclarations().find((importDecl) => {
    const importedNames = new Set(
      importDecl.getNamedImports().map((specifier) => specifier.getName()),
    )

    return (
      importDecl.getModuleSpecifierValue() === PAYLOAD_LAYOUTS_IMPORT &&
      importedNames.has('handleServerFunctions') &&
      importedNames.has('RootLayout')
    )
  })
}

function hasGenerateViewportExport(sourceFile: SourceFile): boolean {
  return sourceFile
    .getExportDeclarations()
    .some((exportDecl) =>
      exportDecl.getNamedExports().some((specifier) => specifier.getName() === 'generateViewport'),
    )
}

function hasLocalGenerateViewportDeclaration(sourceFile: SourceFile): boolean {
  return sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).some((identifier) => {
    if (identifier.getText() !== 'generateViewport') {
      return false
    }

    const parent = identifier.getParent()
    if (!parent) {
      return false
    }

    return (
      Node.isFunctionDeclaration(parent) ||
      Node.isVariableDeclaration(parent) ||
      Node.isClassDeclaration(parent) ||
      Node.isMethodDeclaration(parent)
    )
  })
}

function isAppLayoutFile(filePath: string): boolean {
  const pathSegments = filePath.replaceAll('\\', '/').split('/')
  const appSegmentIndex = pathSegments.lastIndexOf('app')
  const fileName = pathSegments.at(-1) ?? ''

  return (
    appSegmentIndex !== -1 &&
    appSegmentIndex < pathSegments.length - 1 &&
    /^layout\.[cm]?[tj]sx?$/.test(fileName)
  )
}
