import { SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Removes `localizeStatus: true` from `versions.drafts` objects and
 * `experimental.localizeStatus: true` from the root Payload config object.
 *
 * Per-locale status is now automatic when localization is configured and the
 * collection/global has localized fields. The config property is no longer needed.
 * Setting `localizeStatus: false` is still valid as an explicit opt-out and is preserved.
 */
export const removeLocalizeStatusConfig: Transform = {
  name: 'remove-localize-status-config',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      // Find all `localizeStatus: true` property assignments
      const targets = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => {
          if (prop.getName() !== 'localizeStatus') {
            return false
          }
          const initKind = prop.getInitializer()?.getKind()
          // Only remove `true` — keep `false` (explicit opt-out)
          return initKind === SyntaxKind.TrueKeyword
        })

      for (const prop of targets) {
        prop.remove()
        mutated = true
      }

      // Also remove the `experimental` block if it becomes empty after removing localizeStatus
      const experimentalProps = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => prop.getName() === 'experimental')

      for (const experimentalProp of experimentalProps) {
        const objLiteral = experimentalProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
        if (objLiteral && objLiteral.getProperties().length === 0) {
          experimentalProp.remove()
          mutated = true
        }
      }

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Remove `localizeStatus: true` from versions.drafts config and `experimental.localizeStatus` from root Payload config. Per-locale status is now automatically enabled when localization is configured and the collection/global has localized fields.',
}
