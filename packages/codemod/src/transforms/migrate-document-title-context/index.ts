import type { SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const UI_MODULE = '@payloadcms/ui'
const SOURCE_HOOK = 'useDocumentInfo'
const TARGET_HOOK = 'useDocumentTitle'
const MOVED_PROPERTIES = new Set(['setDocumentTitle', 'title'])

export const migrateDocumentTitleContext: Transform = {
  name: 'migrate-document-title-context',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      if (!hasUseDocumentInfoFromUI(sourceFile)) {
        continue
      }

      let fileChanged = false

      for (const decl of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
        const initializer = decl.getInitializer()
        if (!initializer || !Node.isCallExpression(initializer)) {
          continue
        }

        const callee = initializer.getExpression()
        if (!Node.isIdentifier(callee) || callee.getText() !== SOURCE_HOOK) {
          continue
        }

        const nameNode = decl.getNameNode()
        if (!Node.isObjectBindingPattern(nameNode)) {
          continue
        }

        const elements = nameNode.getElements()
        const moved: { alias: null | string; name: string }[] = []
        const remainingTexts: string[] = []
        let bailed = false

        for (const el of elements) {
          const propertyNameNode = el.getPropertyNameNode()
          const sourceName = propertyNameNode
            ? propertyNameNode.getText()
            : el.getNameNode().getText()
          const localName = el.getNameNode().getText()
          const isRest = Boolean(el.getDotDotDotToken())

          if (isRest || !MOVED_PROPERTIES.has(sourceName)) {
            remainingTexts.push(el.getText())
            continue
          }

          if (el.getInitializer()) {
            notes.push(
              `${sourceFile.getFilePath()}: '${sourceName}' destructured from useDocumentInfo() with a default value — migrate manually.`,
            )
            bailed = true
            break
          }

          const alias = propertyNameNode ? localName : null
          moved.push({ name: sourceName, alias })
        }

        if (bailed || moved.length === 0) {
          continue
        }

        const variableStatement = decl.getFirstAncestorByKind(SyntaxKind.VariableStatement)
        if (!variableStatement) {
          notes.push(
            `${sourceFile.getFilePath()}: useDocumentInfo() destructure of ${moved
              .map((m) => `'${m.name}'`)
              .join(', ')} is not at statement scope — migrate manually.`,
          )
          continue
        }

        const parent = variableStatement.getParent()
        if (!Node.isSourceFile(parent) && !Node.isBlock(parent) && !Node.isModuleBlock(parent)) {
          notes.push(
            `${sourceFile.getFilePath()}: useDocumentInfo() destructure of ${moved
              .map((m) => `'${m.name}'`)
              .join(', ')} is in an unsupported scope — migrate manually.`,
          )
          continue
        }

        const insertIndex = variableStatement.getChildIndex() + 1

        if (remainingTexts.length === 0) {
          variableStatement.remove()
        } else {
          nameNode.replaceWithText(`{ ${remainingTexts.join(', ')} }`)
        }

        const properties = moved.map((m) => (m.alias ? `${m.name}: ${m.alias}` : m.name)).join(', ')
        const statementText = `const { ${properties} } = ${TARGET_HOOK}()`

        const targetIndex = remainingTexts.length === 0 ? insertIndex - 1 : insertIndex
        parent.insertStatements(targetIndex, statementText)

        fileChanged = true
      }

      if (fileChanged) {
        ensureUseDocumentTitleImport(sourceFile)
        removeUseDocumentInfoImportIfUnused(sourceFile)
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Migrate `title` and `setDocumentTitle` destructured from useDocumentInfo() to useDocumentTitle() (DocumentTitleContext). Removed from DocumentInfoContext in v4.',
}

function hasUseDocumentInfoFromUI(sourceFile: SourceFile): boolean {
  return sourceFile
    .getImportDeclarations()
    .some(
      (decl) =>
        decl.getModuleSpecifierValue() === UI_MODULE &&
        decl.getNamedImports().some((named) => named.getName() === SOURCE_HOOK),
    )
}

function ensureUseDocumentTitleImport(sourceFile: SourceFile): void {
  const uiImport = sourceFile
    .getImportDeclarations()
    .find((decl) => decl.getModuleSpecifierValue() === UI_MODULE)

  if (!uiImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: UI_MODULE,
      namedImports: [TARGET_HOOK],
    })
    return
  }

  const alreadyImported = uiImport
    .getNamedImports()
    .some((named) => named.getName() === TARGET_HOOK)

  if (!alreadyImported) {
    uiImport.addNamedImport(TARGET_HOOK)
  }
}

function removeUseDocumentInfoImportIfUnused(sourceFile: SourceFile): void {
  const uiImport = sourceFile
    .getImportDeclarations()
    .find((decl) => decl.getModuleSpecifierValue() === UI_MODULE)

  if (!uiImport) {
    return
  }

  const docInfoImport = uiImport.getNamedImports().find((named) => named.getName() === SOURCE_HOOK)

  if (!docInfoImport) {
    return
  }

  const stillUsed = sourceFile
    .getDescendantsOfKind(SyntaxKind.Identifier)
    .filter((id) => id.getText() === SOURCE_HOOK)
    .some((id) => {
      const ancestorImport = id.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)
      return !ancestorImport
    })

  if (!stillUsed) {
    docInfoImport.remove()
  }
}
