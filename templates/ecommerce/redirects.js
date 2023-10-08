// Note: This will not work in dev mode and will throw an error upon startup
// This is because the Payload APIs are not yet running when the Next.js server starts
// This is not a problem in production as Payload is booted up before building Next.js
// For this reason the errors can be silently ignored in dev mode

module.exports = async () => {
  const internetExplorerRedirect = {
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    destination: '/ie-incompatible.html',
  }

  try {
    const redirectsRes = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/redirects?limit=1000&depth=1`,
    )

    const redirectsData = await redirectsRes.json()
    const { docs } = redirectsData

    let dynamicRedirects = []

    if (docs) {
      docs.forEach(doc => {
        const { from, to: { type, url, reference } = {} } = doc

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
          source,
          destination,
          permanent: true,
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
