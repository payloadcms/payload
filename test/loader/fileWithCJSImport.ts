//@ts-expect-error
import Link from 'next/link' // Intentionally omit the .js extension. This needs to be a CJS .js file not included in the packages package.json main or exports fields

if (typeof Link.render !== 'function') {
  throw new Error('Link.render is not a function')
}
