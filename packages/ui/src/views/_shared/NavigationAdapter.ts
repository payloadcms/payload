/**
 * Framework-agnostic navigation primitives that shared view RSCs use to
 * trigger redirects or 404s without importing framework-specific modules
 * (`next/navigation`, `@tanstack/react-router`, etc.).
 *
 * Each adapter supplies an implementation:
 * - **Next.js** forwards to `next/navigation`'s `notFound()` / `redirect()`.
 * - **TanStack Start** throws the values TanStack Router expects (`notFound()`
 *   from `@tanstack/react-router` for 404s, a `redirect()` object for moves).
 *
 * Both functions are typed as returning `never` because they must throw to
 * halt rendering — callers can compose them like:
 * ```ts
 * if (!doc) navigation.notFound()
 * if (somethingMoved) navigation.redirect('/elsewhere')
 * ```
 */
export type NavigationAdapter = {
  /**
   * Halt rendering and signal the framework's 404 path. Must throw.
   */
  notFound: () => never
  /**
   * Halt rendering and signal a redirect to `url`. Must throw.
   */
  redirect: (url: string) => never
}
