import type { Transform } from '../../types.js'

/**
 * Removes `localizeStatus: true` and `localizeStatus: false` from `versions.drafts` objects and
 * `experimental.localizeStatus` from the root Payload config object.
 *
 * Per-locale status is now automatic when localization is configured and the
 * collection/global has localized fields. The config property is no longer needed.
 * Neither boolean value is a supported input option; `false` does not opt out.
 */
export const removeLocalizeStatusConfig: Transform = {
  name: 'remove-localize-status-config',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let text = sourceFile.getFullText()
      const original = text

      // Remove obsolete boolean localizeStatus settings.
      text = text.replace(/^[^\S\n]*localizeStatus:\s*(?:true|false),?\s*\n/gm, '')

      // Remove now-empty `experimental: {}` blocks (with optional whitespace inside braces)
      // Handles: `experimental: {\n  },` or `experimental: {\n},` etc.
      text = text.replace(/^[^\S\n]*experimental:\s*\{\s*\},?\s*\n/gm, '')

      if (text !== original) {
        sourceFile.replaceWithText(text)
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Remove `localizeStatus` boolean settings from versions.drafts config and `experimental.localizeStatus` from root Payload config. Per-locale status is now automatically enabled when localization is configured and the collection/global has localized fields.',
}
