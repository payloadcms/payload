import type { ObjectLiteralExpression, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

export const migrateForceSelect: Transform = {
  name: 'migrate-force-select',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const targets = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => prop.getName() === 'forceSelect')

      for (const prop of targets) {
        const parent = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
        if (!parent) {
          continue
        }

        const filePath = sourceFile.getFilePath()
        const initializer = prop.getInitializer()
        const siblingSelect = parent.getProperty('select')

        if (siblingSelect) {
          prop.remove()
          notes.push(
            `${filePath}: 'forceSelect' removed but sibling 'select' already present — verify the migration covers both.`,
          )
          filesChanged.add(filePath)
          continue
        }

        if (!initializer || !Node.isObjectLiteralExpression(initializer)) {
          prop.remove()
          notes.push(
            `${filePath}: 'forceSelect' value is not an object literal — migrate manually to 'select: ({ select }) => ...'.`,
          )
          filesChanged.add(filePath)
          continue
        }

        const parts = collectSelectParts(initializer)
        if (!parts) {
          prop.remove()
          notes.push(
            `${filePath}: 'forceSelect' contains unsupported syntax (shorthand, methods, computed names) — migrate manually to 'select: ({ select }) => ...'.`,
          )
          filesChanged.add(filePath)
          continue
        }

        if (hasNestedObjectLiteral(initializer)) {
          ensureDeepMergeImport(sourceFile)
          prop.set({
            name: 'select',
            initializer: `({ select }) => (select ? deepMergeSimple(select, { ${parts.join(', ')} }) : undefined)`,
          })
          filesChanged.add(filePath)
          continue
        }

        prop.set({
          name: 'select',
          initializer: `({ select }) => (select ? { ...select, ${parts.join(', ')} } : undefined)`,
        })
        filesChanged.add(filePath)
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    "Migrate 'forceSelect: { ... }' to a 'select' function on Collection and Global configs. Shallow values become spread; nested values use 'deepMergeSimple' from 'payload/shared'.",
}

function hasNestedObjectLiteral(obj: ObjectLiteralExpression): boolean {
  return obj.getProperties().some((p) => {
    if (!Node.isPropertyAssignment(p)) {
      return false
    }
    return Node.isObjectLiteralExpression(p.getInitializer())
  })
}

function collectSelectParts(obj: ObjectLiteralExpression): null | string[] {
  const parts: string[] = []

  for (const prop of obj.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const name = prop.getNameNode().getText()
      const init = prop.getInitializer()
      if (!init) {
        return null
      }
      parts.push(`${name}: ${init.getText()}`)
      continue
    }

    if (Node.isSpreadAssignment(prop)) {
      parts.push(prop.getText())
      continue
    }

    return null
  }

  return parts
}

function ensureDeepMergeImport(sourceFile: SourceFile): void {
  const alreadyImported = sourceFile.getImportDeclarations().some((decl) => {
    return decl.getNamedImports().some((named) => named.getName() === 'deepMergeSimple')
  })
  if (alreadyImported) {
    return
  }
  sourceFile.addImportDeclaration({
    moduleSpecifier: 'payload/shared',
    namedImports: ['deepMergeSimple'],
  })
}
