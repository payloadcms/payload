import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Rewrites `auth.disableLocalStrategy` into `auth.localStrategy` inside any
 * object literal, inverting the value semantics:
 *
 *   disableLocalStrategy: true                                → localStrategy: false
 *   disableLocalStrategy: false                               → (removed; new default is enabled)
 *   disableLocalStrategy: { enableFields: true }              → localStrategy: { enabled: false, disableFields: false }
 *   disableLocalStrategy: { optionalPassword: true }          → localStrategy: { enabled: false, optionalPassword: true }
 *   disableLocalStrategy: { enableFields, optionalPassword }  → localStrategy: { enabled: false, disableFields: false, optionalPassword: true }
 */
export const renameDisableLocalStrategy: Transform = {
  name: 'rename-disable-local-strategy',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        if (!Node.isPropertyAssignment(node)) {
          return
        }

        const nameNode = node.getNameNode()
        const name = nameNode.getText()
        if (name !== 'disableLocalStrategy' && name !== "'disableLocalStrategy'") {
          return
        }

        const initializer = node.getInitializer()
        if (!initializer) {
          return
        }

        const kind = initializer.getKind()

        if (kind === SyntaxKind.TrueKeyword) {
          node.replaceWithText('localStrategy: false')
          mutated = true
          return
        }

        if (kind === SyntaxKind.FalseKeyword) {
          // Old `disableLocalStrategy: false` was the default; the new default
          // is `localStrategy: true`, so drop the property entirely.
          const parent = node.getParent()
          if (Node.isObjectLiteralExpression(parent) && parent.getProperties().length === 1) {
            // Collapse `{ disableLocalStrategy: false }` into `{}` in one step
            // to avoid a stray blank line inside the object.
            parent.replaceWithText('{}')
          } else {
            node.remove()
          }
          mutated = true
          return
        }

        if (Node.isObjectLiteralExpression(initializer)) {
          let disableFields: boolean | undefined
          let optionalPassword: boolean | undefined

          for (const prop of initializer.getProperties()) {
            if (!Node.isPropertyAssignment(prop)) {
              continue
            }

            const key = prop.getNameNode().getText()
            const value = prop.getInitializer()
            if (!value) {
              continue
            }

            if (key === 'enableFields' && value.getKind() === SyntaxKind.TrueKeyword) {
              // enableFields: true (disabled but keep DB fields) → disableFields: false
              disableFields = false
            } else if (key === 'optionalPassword' && value.getKind() === SyntaxKind.TrueKeyword) {
              optionalPassword = true
            }
          }

          const parts = ['enabled: false']
          if (disableFields === false) {
            parts.push('disableFields: false')
          }
          if (optionalPassword === true) {
            parts.push('optionalPassword: true')
          }

          node.replaceWithText(`localStrategy: { ${parts.join(', ')} }`)
          mutated = true
        }
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Renames `auth.disableLocalStrategy` to `auth.localStrategy` and inverts the value: `true` becomes `false`, `false` is removed (new default is enabled), and `{ enableFields, optionalPassword }` becomes `{ enabled: false, disableFields: false, optionalPassword: true }`.',
}
