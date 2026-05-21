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

const STYLE_EXTENSION_RE = /\.(?:s?css|less)(?:\?[^#]*)?(?:#.*)?$/i
const ASSET_EXTENSION_RE =
  /\.(?:svg|png|jpe?g|gif|webp|avif|ico|bmp|tiff?|woff2?|ttf|otf|eot|mp[34]|webm|ogg|oga|wav|flac|m4a|m4v|mov|pdf)(?:\?[^#]*)?(?:#.*)?$/i

const isStylesheet = (s) => STYLE_EXTENSION_RE.test(s)
const isStaticAsset = (s) => ASSET_EXTENSION_RE.test(s)

const stubSource = (specifier) => {
  if (isStylesheet(specifier)) {
    // Stylesheet imports usually have no JS-visible exports, so an empty
    // module is fine and matches Vite's `?inline` / extracted-css behaviour.
    return ''
  }
  // Treat every other static asset like Vite's default asset pipeline:
  // expose the (escaped) specifier as both a default export and a `src`
  // property. This lets code like
  //   import logo from './logo.svg'        -> uses the default export
  //   import { src } from './logo.png'     -> Next.js `StaticImageData` shim
  //   logo === '/logo.svg'                 -> truthy, sufficient for tests
  // continue to work without crashing during SSR.
  const value = JSON.stringify(specifier)
  return `const __asset = ${value};
export default __asset;
export const src = __asset;
export const height = 0;
export const width = 0;
export const blurWidth = 0;
export const blurHeight = 0;
`
}

export async function resolve(specifier, context, nextResolve) {
  if (isStylesheet(specifier) || isStaticAsset(specifier)) {
    return {
      format: 'module',
      shortCircuit: true,
      url: `data:text/javascript;base64,${Buffer.from(stubSource(specifier)).toString('base64')}`,
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (isStylesheet(url) || isStaticAsset(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: stubSource(url),
    }
  }
  return nextLoad(url, context)
}
