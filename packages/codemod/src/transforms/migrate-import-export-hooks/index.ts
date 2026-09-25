import type { ObjectLiteralExpression, PropertyAssignment } from 'ts-morph'

import { Node } from 'ts-morph'

import type { Transform } from '../../types.js'

export const migrateImportExportHooks: Transform = {
  name: 'migrate-import-export-hooks',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        if (!Node.isPropertyAssignment(node)) {
          return
        }

        // Target the 'plugin-import-export' string-literal key only
        const nameNode = node.getNameNode()
        if (!Node.isStringLiteral(nameNode)) {
          return
        }
        if (nameNode.getLiteralValue() !== 'plugin-import-export') {
          return
        }

        const pluginObj = node.getInitializer()
        if (!pluginObj || !Node.isObjectLiteralExpression(pluginObj)) {
          return
        }

        const toCSVProp = findProp(pluginObj, 'toCSV')
        const fromCSVProp = findProp(pluginObj, 'fromCSV')

        if (!toCSVProp && !fromCSVProp) {
          return
        }

        // Check if a hooks object already exists and validate it
        const existingHooksProp = findProp(pluginObj, 'hooks')
        if (existingHooksProp) {
          const hooksInit = existingHooksProp.getInitializer()
          if (!hooksInit || !Node.isObjectLiteralExpression(hooksInit)) {
            notes.push(
              `${sourceFile.getFilePath()}: 'hooks' value is non-literal — migrate toCSV/fromCSV manually.`,
            )
            return
          }
        }

        // Capture function text before any removal (node refs may become stale)
        const toCSVText = toCSVProp?.getInitializer()?.getText()
        const fromCSVText = fromCSVProp?.getInitializer()?.getText()

        toCSVProp?.remove()
        fromCSVProp?.remove()

        let hooksInit: ObjectLiteralExpression

        if (existingHooksProp) {
          // Re-find hooks after the AST was mutated by the removes
          hooksInit = findProp(pluginObj, 'hooks')!.getInitializer() as ObjectLiteralExpression
        } else {
          // Create an empty hooks object, then fill it below
          pluginObj.addPropertyAssignment({ name: 'hooks', initializer: '{}' })
          hooksInit = findProp(pluginObj, 'hooks')!.getInitializer() as ObjectLiteralExpression
        }

        if (toCSVText && !hooksInit.getProperty('beforeExport')) {
          hooksInit.addPropertyAssignment({ name: 'beforeExport', initializer: toCSVText })
        }
        if (fromCSVText && !hooksInit.getProperty('beforeImport')) {
          hooksInit.addPropertyAssignment({ name: 'beforeImport', initializer: fromCSVText })
        }

        mutated = true
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
        notes.push(
          `${sourceFile.getFilePath()}: toCSV/fromCSV migrated to hooks.beforeExport/hooks.beforeImport. Review argument shapes — beforeExport uses 'siblingData' (not 'row'), and 'data' is the top-level document (previously 'doc').`,
        )
      }
    }

    return { filesChanged: [...filesChanged], notes }
  },
  description:
    "Migrate field-level toCSV and fromCSV in custom['plugin-import-export'] to hooks.beforeExport and hooks.beforeImport.",
}

function findProp(obj: ObjectLiteralExpression, name: string): PropertyAssignment | undefined {
  return obj
    .getProperties()
    .find((p): p is PropertyAssignment => Node.isPropertyAssignment(p) && p.getName() === name)
}
