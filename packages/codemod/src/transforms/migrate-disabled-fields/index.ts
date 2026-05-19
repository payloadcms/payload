import type { ObjectLiteralExpression, PropertyAssignment } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const OLD_TO_NEW: Record<string, string> = {
  disableBulkEdit: 'bulkEdit',
  disableGroupBy: 'groupBy',
  disableListColumn: 'column',
  disableListFilter: 'filter',
}

export const migrateDisabledFields: Transform = {
  name: 'migrate-disabled-fields',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        if (!Node.isPropertyAssignment(node)) {
          return
        }
        if (node.getName() !== 'admin') {
          return
        }
        const initializer = node.getInitializer()
        if (!initializer || !Node.isObjectLiteralExpression(initializer)) {
          return
        }
        // Only treat this as a field admin object when the parent has a `type` sibling
        // (fields always have `type`; collection-level admin and imageSize.admin don't).
        const parent = node.getParent()
        if (!parent || !Node.isObjectLiteralExpression(parent)) {
          return
        }
        if (!parent.getProperty('type')) {
          return
        }

        const oldProps: PropertyAssignment[] = []
        for (const prop of initializer.getProperties()) {
          if (Node.isPropertyAssignment(prop) && prop.getName() in OLD_TO_NEW) {
            oldProps.push(prop)
          }
        }

        if (oldProps.length === 0) {
          return
        }

        const collectedTrueKeys: string[] = []
        let nonLiteralEncountered = false

        for (const prop of oldProps) {
          const init = prop.getInitializer()
          if (init?.getKind() === SyntaxKind.TrueKeyword) {
            collectedTrueKeys.push(OLD_TO_NEW[prop.getName()]!)
          } else if (init?.getKind() === SyntaxKind.FalseKeyword) {
            // false → drop; absence in new shape means area is enabled.
          } else {
            nonLiteralEncountered = true
          }
        }

        if (nonLiteralEncountered) {
          notes.push(
            `${sourceFile.getFilePath()}: Non-literal disable* value found in admin object — skipped. Migrate manually.`,
          )
          return
        }

        const existingDisabled = initializer
          .getProperties()
          .find(
            (prop): prop is PropertyAssignment =>
              Node.isPropertyAssignment(prop) && prop.getName() === 'disabled',
          )

        for (const prop of oldProps) {
          prop.remove()
        }

        if (collectedTrueKeys.length === 0) {
          mutated = true
          return
        }

        const sortedKeys = [...collectedTrueKeys].sort()
        const newProps = sortedKeys.map((key) => `${key}: true`).join(', ')

        if (!existingDisabled) {
          initializer.addPropertyAssignment({
            name: 'disabled',
            initializer: `{ ${newProps} }`,
          })
        } else {
          const existingInit = existingDisabled.getInitializer()
          if (existingInit?.getKind() === SyntaxKind.TrueKeyword) {
            // disabled: true already covers everything — drop new keys.
          } else if (existingInit?.getKind() === SyntaxKind.FalseKeyword) {
            existingDisabled.setInitializer(`{ ${newProps} }`)
          } else if (existingInit && Node.isObjectLiteralExpression(existingInit)) {
            mergeAndSortObject(existingInit, sortedKeys)
          } else {
            notes.push(
              `${sourceFile.getFilePath()}: existing 'disabled' value is non-literal — merged keys may be incorrect.`,
            )
          }
        }

        mutated = true
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged], notes }
  },
  description:
    'Migrate field.admin.disable* props (disableListColumn, disableListFilter, disableGroupBy, disableBulkEdit) into the consolidated disabled object form.',
}

const mergeAndSortObject = (existing: ObjectLiteralExpression, newKeys: string[]): void => {
  const merged = new Map<string, string>()
  for (const prop of existing.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const init = prop.getInitializer()
      merged.set(prop.getName(), init?.getText() ?? 'true')
    }
  }
  for (const key of newKeys) {
    if (!merged.has(key)) {
      merged.set(key, 'true')
    }
  }
  const sortedKeys = [...merged.keys()].sort()
  const inline = sortedKeys.map((key) => `${key}: ${merged.get(key)}`).join(', ')
  existing.replaceWithText(`{ ${inline} }`)
}
