import type { LivePreviewConfig } from 'payload'

export const formatLivePreviewURL: LivePreviewConfig['url'] = async ({
  data,
  collectionConfig,
  req,
}) => {
  let baseURL = `/live-preview`

  // You can run async requests here, if needed
  // For example, multi-tenant apps may need to lookup additional data
  if (data.tenant) {
    try {
      const fullTenant = await req.payload
        .find({
          collection: 'tenants',
          where: {
            id: {
              equals: data.tenant,
            },
          },
          limit: 1,
          depth: 0,
        })
        .then((res) => res?.docs?.[0])

      if (fullTenant?.clientURL) {
        // Note: appending a fully-qualified URL here won't work for preview deployments on Vercel
        baseURL = `${fullTenant.clientURL}/live-preview`
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Format the URL as needed, based on the document and data
  // I.e. append '/posts' to the URL if the document is a post
  // You can also do this on individual collection or global config, if preferred
  const isPage = collectionConfig && collectionConfig.slug === 'pages'
  const isHomePage = isPage && data?.slug === 'home'

  return `${baseURL}${
    !isPage && collectionConfig ? `/${collectionConfig.slug}` : ''
  }${!isHomePage && data.slug ? `/${data.slug}` : ''}`
}
