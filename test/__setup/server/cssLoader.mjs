// Packed dependencies can escape Vite SSR/RSC processing and reach Node with static asset imports.
// Stub those imports in the test dev server to avoid ERR_UNKNOWN_FILE_EXTENSION.
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
