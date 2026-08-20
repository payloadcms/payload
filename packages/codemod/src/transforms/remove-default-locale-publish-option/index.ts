import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

/**
 * Removes `defaultLocalePublishOption` from `localization` config objects.
 *
 * The Admin UI Publish button now always defaults to publishing the active
 * locale when localized fields exist, with "Publish all locales" available
 * as a secondary option. The config property is no longer needed.
 */
export const removeDefaultLocalePublishOption: Transform = {
  name: 'remove-default-locale-publish-option',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      const targets = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .filter((prop) => {
          if (prop.getName() !== 'defaultLocalePublishOption') {
            return false
          }
          const parentObject = prop.getParentIfKind(SyntaxKind.ObjectLiteralExpression)
          const localizationProp = parentObject?.getParentIfKind(SyntaxKind.PropertyAssignment)
          return localizationProp?.getName() === 'localization'
        })

      for (const prop of targets) {
        const initializer = prop.getInitializer()

        if (
          initializer &&
          Node.isStringLiteral(initializer) &&
          initializer.getLiteralValue() === 'all'
        ) {
          notes.push(
            `${sourceFile.getFilePath()}: 'localization.defaultLocalePublishOption' was set to 'all' — the Admin UI Publish button now defaults to publishing only the active locale instead. Use the "Publish all locales" option in the Publish button dropdown to publish every locale at once.`,
          )
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
    'Remove localization.defaultLocalePublishOption from Payload configs. The Admin UI Publish button now always defaults to publishing the active locale when localized fields exist, with "Publish all locales" available as a secondary dropdown option.',
}
