import type { Transform } from '../../types.js'

/**
 * Removes `defaultLocalePublishOption` from the root `localization` config.
 *
 * The admin Publish button now always defaults to publishing the active locale;
 * "Publish all locales" is available via the secondary button. The config
 * property has no effect and is no longer typed.
 */
export const removeDefaultLocalePublishOption: Transform = {
  name: 'remove-default-locale-publish-option',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let text = sourceFile.getFullText()
      const original = text

      // Remove `defaultLocalePublishOption: 'active',` / `defaultLocalePublishOption: 'all',`
      // (single or double quotes, with or without a trailing comma).
      text = text.replace(
        /^[^\S\n]*defaultLocalePublishOption:\s*['"](?:active|all)['"],?\s*\n/gm,
        '',
      )

      if (text !== original) {
        sourceFile.replaceWithText(text)
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    "Remove `defaultLocalePublishOption` from the root localization config. The admin Publish button now always defaults to the active locale, with 'Publish all locales' available via the secondary button; the option no longer has any effect.",
}
