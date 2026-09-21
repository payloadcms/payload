import type {
  Expression,
  ObjectLiteralExpression,
  PropertyAssignment,
  ShorthandPropertyAssignment,
} from 'ts-morph'

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
    const notes = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      const localizationProperties = [
        ...sourceFile
          .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
          .filter((property) => property.getName() === 'localization'),
        ...sourceFile
          .getDescendantsOfKind(SyntaxKind.ShorthandPropertyAssignment)
          .filter((property) => property.getName() === 'localization'),
      ]

      for (const localizationProperty of localizationProperties) {
        const localizationResolution = resolveLocalizationObject({
          property: localizationProperty,
        })

        if (localizationResolution.isUnresolved) {
          notes.add(
            `${sourceFile.getFilePath()}: 'localization' uses a value that cannot be resolved safely — migrate manually by removing 'localization.defaultLocalePublishOption' if it is present.`,
          )
          continue
        }

        const localizationObject = localizationResolution.object

        if (!localizationObject) {
          continue
        }

        if (
          localizationObject.getProperties().some((property) => Node.isSpreadAssignment(property))
        ) {
          notes.add(
            `${sourceFile.getFilePath()}: 'localization' includes a spread — migrate manually by removing 'localization.defaultLocalePublishOption' if it is present in the spread value.`,
          )
        }

        const defaultLocalePublishOption = localizationObject.getProperty(
          'defaultLocalePublishOption',
        )

        if (!defaultLocalePublishOption || !Node.isPropertyAssignment(defaultLocalePublishOption)) {
          continue
        }

        const initializer = defaultLocalePublishOption.getInitializer()

        if (
          initializer &&
          Node.isStringLiteral(initializer) &&
          initializer.getLiteralValue() === 'all'
        ) {
          notes.add(
            `${sourceFile.getFilePath()}: 'localization.defaultLocalePublishOption' was set to 'all' — the Admin UI Publish button now defaults to publishing only the active locale instead. Use the "Publish all locales" option in the Publish button dropdown to publish every locale at once.`,
          )
        }

        defaultLocalePublishOption.remove()
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      ...(notes.size > 0 ? { notes: Array.from(notes) } : {}),
    }
  },
  description:
    'Remove localization.defaultLocalePublishOption from Payload configs. The Admin UI Publish button now always defaults to publishing the active locale when localized fields exist, with "Publish all locales" available as a secondary dropdown option.',
}

type LocalizationProperty = PropertyAssignment | ShorthandPropertyAssignment

type LocalizationResolution = {
  isUnresolved: boolean
  object?: ObjectLiteralExpression
}

function resolveLocalizationObject({
  property,
}: {
  property: LocalizationProperty
}): LocalizationResolution {
  if (Node.isPropertyAssignment(property)) {
    return resolveLocalizationInitializer({ initializer: property.getInitializer() })
  }

  const variableDeclaration = property
    .getValueSymbol()
    ?.getDeclarations()
    .find(Node.isVariableDeclaration)

  return resolveLocalizationInitializer({ initializer: variableDeclaration?.getInitializer() })
}

function resolveLocalizationInitializer({
  initializer,
}: {
  initializer: Expression | undefined
}): LocalizationResolution {
  if (!initializer) {
    return { isUnresolved: true }
  }

  if (Node.isObjectLiteralExpression(initializer)) {
    return { isUnresolved: false, object: initializer }
  }

  if (initializer.getKind() === SyntaxKind.FalseKeyword) {
    return { isUnresolved: false }
  }

  if (Node.isIdentifier(initializer)) {
    const variableDeclaration = initializer
      .getDefinitions()
      .map((definition) => definition.getDeclarationNode())
      .find(Node.isVariableDeclaration)

    return resolveLocalizationInitializer({ initializer: variableDeclaration?.getInitializer() })
  }

  return { isUnresolved: true }
}
