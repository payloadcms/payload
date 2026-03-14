import type { PayloadRequest } from '../../types/index.js'

import { getLocalizedValue } from './getLocalizedValue.js'

type BuildLocalizedPathsArgs = {
  /**
   * Optional parent's slug paths by locale (e.g., { en: "/blog/tech", es: "/blog/tecnologia" })
   * If provided, these paths will be prepended to the generated slug segments
   */
  parentSlugPath?: Record<string, string>
  /**
   * Optional parent's title paths by locale (e.g., { en: "Blog / Tech", es: "Blog / Tecnología" })
   * If provided, these paths will be prepended to the generated title segments
   */
  parentTitlePath?: Record<string, string>
  /**
   * The Payload request object - used to access locale configuration and fallback settings
   */
  req: PayloadRequest
  /**
   * Function to convert title text into URL-safe slug segments
   */
  slugify: (val: string) => string
  /**
   * The localized title value object (e.g., { en: "Home", es: "Inicio", de: "Startseite" })
   */
  titleValue: Record<string, string>
}

type BuildLocalizedPathsResult = {
  slugPath: Record<string, string>
  titlePath: Record<string, string>
}

/**
 * Builds localized slug and title paths for all configured locales.
 * Applies proper fallback locale handling and optionally prepends parent paths.
 *
 * This utility is used when `locale: 'all'` is requested and the title field is localized,
 * generating a path for each locale with proper fallback handling.
 *
 * @example
 * ```ts
 * // Without parent (root document)
 * buildLocalizedPaths({
 *   req,
 *   slugify: (val) => val.toLowerCase().replace(/\s/g, '-'),
 *   titleValue: { en: "Home", es: "Inicio", de: "" }
 * })
 * // Returns:
 * // {
 * //   slugPath: { en: "home", es: "inicio", de: "home" }, // 'de' falls back to 'en'
 * //   titlePath: { en: "Home", es: "Inicio", de: "Home" }
 * // }
 *
 * // With parent paths
 * buildLocalizedPaths({
 *   parentSlugPath: { en: "/blog", es: "/blog" },
 *   parentTitlePath: { en: "Blog", es: "Blog" },
 *   req,
 *   slugify: (val) => val.toLowerCase().replace(/\s/g, '-'),
 *   titleValue: { en: "Tech News", es: "Noticias Tecnológicas" }
 * })
 * // Returns:
 * // {
 * //   slugPath: { en: "/blog/tech-news", es: "/blog/noticias-tecnologicas" },
 * //   titlePath: { en: "Blog / Tech News", es: "Blog / Noticias Tecnológicas" }
 * // }
 * ```
 *
 * @param args - Configuration for building localized paths
 * @returns Object containing slugPath and titlePath, each mapping locale codes to path strings
 */
export function buildLocalizedHierarchyPaths(
  args: BuildLocalizedPathsArgs,
): BuildLocalizedPathsResult {
  const { parentSlugPath, parentTitlePath, req, slugify, titleValue } = args

  const slugPathsByLocale: Record<string, string> = {}
  const titlePathsByLocale: Record<string, string> = {}

  const locales = req.payload.config.localization ? req.payload.config.localization.localeCodes : []

  for (const loc of locales) {
    const localizedTitle = getLocalizedValue({
      fallbackLocale: req.fallbackLocale,
      fieldType: 'text',
      locale: loc,
      value: titleValue,
    })

    if (localizedTitle) {
      const slugSegment = slugify(localizedTitle)
      const titleSegment = localizedTitle

      slugPathsByLocale[loc] = parentSlugPath
        ? `${parentSlugPath[loc]}/${slugSegment}`
        : slugSegment
      titlePathsByLocale[loc] = parentTitlePath
        ? `${parentTitlePath[loc]}/${titleSegment}`
        : titleSegment
    }
  }

  return {
    slugPath: slugPathsByLocale,
    titlePath: titlePathsByLocale,
  }
}
