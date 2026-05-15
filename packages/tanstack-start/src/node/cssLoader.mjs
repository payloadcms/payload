/**
 * Node ESM loader hook that swallows static asset imports (CSS/SCSS/LESS,
 * images, fonts, audio, video, etc.) encountered while running the dev
 * server.
 *
 * Vite is supposed to intercept asset imports during SSR/RSC by treating
 * the package as `noExternal`, but that resolution path silently breaks down
 * when a dependency is installed from a packed tarball under
 * `node_modules/.pnpm/<pkg>@file+packed+...`. In that scenario Vite hands the
 * import to Node's native ESM loader, which has no opinion about `.css` /
 * `.svg` / `.png` files and throws `ERR_UNKNOWN_FILE_EXTENSION`. That single
 * throw cascades into every admin route showing "Something went wrong!"
 * because the SSR tree dies inside `<MatchInnerImpl>`.
 *
 * Registering this loader (with `--import` or `register()`) makes Node treat
 * any asset specifier as an empty ES module, which is exactly what we
 * already do client-side for SSR.
 *
 * The loader is intentionally minimal and side-effect free; it only kicks in
 * for asset specifiers and falls through to the default loader for
 * everything else.
 */

const ASSET_EXTENSION_RE =
  /\.(?:s?css|less|svg|png|jpe?g|gif|webp|avif|ico|bmp|tiff?|woff2?|ttf|otf|eot|mp[34]|webm|ogg|oga|wav|flac|m4a|m4v|mov|pdf)(?:\?[^#]*)?(?:#.*)?$/i

export async function resolve(specifier, context, nextResolve) {
  if (ASSET_EXTENSION_RE.test(specifier)) {
    return {
      format: 'module',
      shortCircuit: true,
      url: `data:text/javascript,/* asset import stub for ${encodeURIComponent(
        specifier,
      )} */`,
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (ASSET_EXTENSION_RE.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: '',
    }
  }
  return nextLoad(url, context)
}
