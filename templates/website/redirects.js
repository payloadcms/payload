import { getPayload } from 'payload'
import { importConfig } from 'payload/node'

const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  try {
    const config = await importConfig('./src/payload.config.ts')
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'redirects',
      depth: 1,
      limit: 1000,
    })

    let dynamicRedirects = []

    if (docs) {
      docs.forEach((doc) => {
        const { from, to: { type, reference, url } = {} } = doc

        let source = from
          .replace(process.env.NEXT_PUBLIC_SERVER_URL, '')
          .split('?')[0]
          .toLowerCase()

        if (source.endsWith('/')) source = source.slice(0, -1) // a trailing slash will break this redirect

        let destination = '/'

        if (type === 'custom' && url) {
          destination = url.replace(process.env.NEXT_PUBLIC_SERVER_URL, '')
        }

        if (
          type === 'reference' &&
          typeof reference.value === 'object' &&
          reference?.value?._status === 'published'
        ) {
          destination = `${process.env.NEXT_PUBLIC_SERVER_URL}/${
            reference.relationTo !== 'pages' ? `${reference.relationTo}/` : ''
          }${reference.value.slug}`
        }

        const redirect = {
          destination,
          permanent: true,
          source,
        }

        if (source.startsWith('/') && destination && source !== destination) {
          return dynamicRedirects.push(redirect)
        }

        return
      })
    }

    const redirects = [internetExplorerRedirect, ...dynamicRedirects]

    return redirects
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Error configuring redirects: ${error}`) // eslint-disable-line no-console
    }

    return []
  }
}

export default redirects
