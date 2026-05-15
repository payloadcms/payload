/**
 * Node ESM loader hook that swallows static `.css`/`.scss`/`.less` imports
 * encountered while running the dev server.
 *
 * Vite is supposed to intercept stylesheet imports during SSR/RSC by treating
 * the package as `noExternal`, but that resolution path silently breaks down
 * when a dependency is installed from a packed tarball under
 * `node_modules/.pnpm/<pkg>@file+packed+...`. In that scenario Vite hands the
 * import to Node's native ESM loader, which has no opinion about `.css` files
 * and throws `ERR_UNKNOWN_FILE_EXTENSION`. That single throw cascades into
 * every admin route showing "Something went wrong!" because the SSR tree
 * dies inside `<MatchInnerImpl>`.
 *
 * Registering this loader (with `--import` or `register()`) makes Node treat
 * any stylesheet specifier as an empty ES module, which is exactly what we
 * already do client-side for SSR.
 *
 * The loader is intentionally minimal and side-effect free; it only kicks in
 * for stylesheet specifiers and falls through to the default loader for
 * everything else.
 */

const STYLE_EXTENSION_RE = /\.(?:s?css|less)(?:\?[^#]*)?(?:#.*)?$/i

export async function resolve(specifier, context, nextResolve) {
  if (STYLE_EXTENSION_RE.test(specifier)) {
    return {
      format: 'module',
      shortCircuit: true,
      url: `data:text/javascript,/* style import stub for ${encodeURIComponent(
        specifier,
      )} */`,
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (STYLE_EXTENSION_RE.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: '',
    }
  }
  return nextLoad(url, context)
}
