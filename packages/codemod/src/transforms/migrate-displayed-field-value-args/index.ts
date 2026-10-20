import type { CallExpression, Identifier } from 'ts-morph'

import { Node } from 'ts-morph'

import type { Transform } from '../../types.js'

const moduleName = '@payloadcms/ui/utilities/getDisplayedFieldValue'
const functionName = 'getDisplayedFieldValue'

export const migrateDisplayedFieldValueArgs: Transform = {
  name: 'migrate-displayed-field-value-args',
  apply: ({ project }) => {
    const filesChanged: string[] = []
    const notes: string[] = []

    for (const file of project.getSourceFiles()) {
      const calls = new Set<CallExpression>()

      for (const declaration of file.getImportDeclarations()) {
        if (declaration.getModuleSpecifierValue() !== moduleName) {
          continue
        }

        for (const specifier of declaration.getNamedImports()) {
          if (specifier.getName() !== functionName || specifier.isTypeOnly()) {
            continue
          }

          const localName = specifier.getAliasNode() ?? specifier.getNameNode()

          if (Node.isIdentifier(localName)) {
            collectCalls({ calls, localName, notes })
          }
        }

        const namespace = declaration.getNamespaceImport()

        if (namespace) {
          collectCalls({ calls, isNamespace: true, localName: namespace, notes })
        }
      }

      const original = file.getFullText()

      for (const call of [...calls].sort((a, b) => b.getStart() - a.getStart())) {
        const args = call.getArguments()

        if (args.length === 1 && Node.isObjectLiteralExpression(args[0])) {
          continue
        }

        if (args.length !== 3 || args.some(Node.isSpreadElement)) {
          notes.push(
            `${file.getFilePath()}:${call.getStartLineNumber()}: ${call.getText()} has unsupported arguments; migrate manually.`,
          )
          continue
        }

        call.replaceWithText(
          `${call.getExpression().getText()}({ cellData: ${args[0]!.getText()}, field: ${args[1]!.getText()}, i18n: ${args[2]!.getText()} })`,
        )
      }

      if (file.getFullText() !== original) {
        filesChanged.push(file.getFilePath())
      }
    }

    return { filesChanged, ...(notes.length > 0 ? { notes } : {}) }
  },
  description:
    'Migrates `getDisplayedFieldValue(cellData, field, i18n)` calls imported from `@payloadcms/ui/utilities/getDisplayedFieldValue` to object arguments.',
}

function collectCalls({
  calls,
  isNamespace = false,
  localName,
  notes,
}: {
  calls: Set<CallExpression>
  isNamespace?: boolean
  localName: Identifier
  notes: string[]
}): void {
  for (const reference of localName.findReferencesAsNodes()) {
    if (reference === localName) {
      continue
    }

    const parent = reference.getParent()
    const expression = isNamespace
      ? Node.isPropertyAccessExpression(parent) &&
        parent.getExpression() === reference &&
        parent.getName() === functionName
        ? parent
        : undefined
      : reference

    if (!expression) {
      continue
    }

    const call = expression.getParent()

    if (Node.isCallExpression(call) && call.getExpression() === expression) {
      calls.add(call)
    } else {
      notes.push(
        `${reference.getSourceFile().getFilePath()}:${reference.getStartLineNumber()}: ${expression.getText()} is referenced without a direct call; migrate manually.`,
      )
    }
  }
}
