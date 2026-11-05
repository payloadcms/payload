import type { ObjectLiteralExpression } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const NESTED_PATH = ['components', 'views', 'edit', 'api', 'tab'] as const

export const migrateHideAPIURL: Transform = {
  name: 'migrate-hide-api-url',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const targets = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => {
          if (prop.getName() !== 'hideAPIURL') {
            return false
          }
          const parentObject = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
          const adminProp = parentObject?.getParentIfKind(SyntaxKind.PropertyAssignment)
          return adminProp?.getName() === 'admin'
        })

      for (const prop of targets) {
        const initializer = prop.getInitializer()
        const kind = initializer?.getKind()

        if (kind === SyntaxKind.FalseKeyword) {
          prop.remove()
          filesChanged.add(sourceFile.getFilePath())
          continue
        }

        if (kind !== SyntaxKind.TrueKeyword) {
          notes.push(
            `${sourceFile.getFilePath()}: 'admin.hideAPIURL' value is not a boolean literal — migrate manually to admin.components.views.edit.api.tab.condition.`,
          )
          continue
        }

        const adminObject = prop.getParentIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        const ok = ensureConditionFalse(adminObject)

        if (!ok) {
          notes.push(
            `${sourceFile.getFilePath()}: could not insert admin.components.views.edit.api.tab.condition — existing nested value is not an object literal. Migrate manually.`,
          )
          continue
        }

        prop.remove()
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Migrate admin.hideAPIURL to admin.components.views.edit.api.tab.condition: () => false.',
}

function ensureConditionFalse(adminObject: ObjectLiteralExpression): boolean {
  let current = adminObject

  for (const segment of NESTED_PATH) {
    const existing = current.getProperty(segment)

    if (existing) {
      if (!Node.isPropertyAssignment(existing)) {
        return false
      }
      const init = existing.getInitializer()
      if (!init || !Node.isObjectLiteralExpression(init)) {
        return false
      }
      current = init
      continue
    }

    const added = current.addPropertyAssignment({ name: segment, initializer: '{}' })
    current = added.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  }

  if (current.getProperty('condition')) {
    return true
  }

  current.addPropertyAssignment({ name: 'condition', initializer: '() => false' })
  return true
}
