/**
 * Webpack / Turbopack loader that appends `export const instant = false` to the route modules
 * rendering the Payload admin panel (`RootLayout` and `RootPage`).
 *
 * With Next.js `cacheComponents`, every route must either produce a static shell or opt out with
 * `instant = false`. The admin panel reads cookies, headers and the database above any Suspense
 * boundary, so it has to opt out. Next.js reads `instant` from the route module itself and rejects
 * it when `cacheComponents` is disabled, which is why it cannot live in the generated admin files.
 * Instead, `withPayload` registers this loader only when `cacheComponents` is enabled.
 */

// Matches e.g. `import { RootLayout } from '@payloadcms/next/layouts'`, including aliased and
// multi-line imports. Matching the import instead of the JSX/call site avoids touching files that
// define their own `RootLayout` component.
const importsPayloadRootComponentRegex =
  /\bimport\s*\{[^}]*\bRoot(?:Layout|Page)\b[^}]*\}\s*from\s*['"]@payloadcms\/next\/(?:layouts|views)['"]/

// Skip files that already declare `instant` (exported or not), so a user's own value wins and we
// never produce a duplicate declaration.
const declaresInstantRegex =
  /\b(?:const|let|var|function|class)\s+instant\b|\bexport\s*\{[^}]*\binstant\b[^}]*\}/

/**
 * @param {string} source
 * @returns {string}
 */
export default function instantLoader(source) {
  if (!importsPayloadRootComponentRegex.test(source) || declaresInstantRegex.test(source)) {
    return source
  }

  return `${source}\nexport const instant = false\n`
}
