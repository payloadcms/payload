import Link from 'next/link.js'

//@ts-expect-error
if (typeof Link.render !== 'function') {
  throw new Error('Link.render is not a function')
}
