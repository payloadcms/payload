import { BasePayload, getPayload } from 'payload'
import { importConfig } from 'payload/node'

const redirects = async () => {
  const awaitedConfig = await importConfig('./src/payload.config.ts')
  /* const payload = await getPayload({ config: awaitedConfig, noCache: true }) */

  const payload = await new BasePayload().init({ config: awaitedConfig })

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

  const { docs: redirectDocs } = await payload.find({
    collection: 'redirects',
    depth: 1,
    limit: 0,
    pagination: false,
  })

  const payloadRedirects = redirectDocs.length
    ? redirectDocs
        .filter((doc) => {
          if (doc.from) {
            return true
          }
          if (doc.to.type === 'custom' && !doc.to.url) {
            return false
          }
          if (doc.to.reference && !doc.to.reference?.value?.slug) {
            return false
          }

          return true
        })
        .map((doc) => {
          const destination =
            doc.to?.type === 'custom'
              ? doc.to.url
              : doc.to.reference?.relationTo === 'posts'
                ? `/posts/${doc.to.reference?.value?.slug}`
                : `/${doc.to.reference.slug}`

          return {
            destination,
            permanent: false,
            source: doc.from,
          }
        })
    : []

  const redirects = [internetExplorerRedirect, ...payloadRedirects]

  return redirects
}

export default redirects
