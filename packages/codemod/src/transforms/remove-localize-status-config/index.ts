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
      let text = sourceFile.getFullText()
      const original = text

      // Remove `localizeStatus: true,` lines (with any leading whitespace and trailing newline)
      text = text.replace(/^[^\S\n]*localizeStatus:\s*true,?\s*\n/gm, '')

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
    'Remove `localizeStatus: true` from versions.drafts config and `experimental.localizeStatus` from root Payload config. Per-locale status is now automatically enabled when localization is configured and the collection/global has localized fields.',
}
