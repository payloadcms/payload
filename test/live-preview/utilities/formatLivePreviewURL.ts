import type { LivePreviewConfig } from 'payload/config'

import type { Tenant } from '../payload-types.js'

export const formatLivePreviewURL: LivePreviewConfig['url'] = async ({
  data,
  collectionConfig,
  payload,
}) => {
  let baseURL = 'http://localhost:3000/live-preview'

  // You can run async requests here, if needed
  // For example, multi-tenant apps may need to lookup additional data
  if (data.tenant) {
    try {
      const fullTenant = (await payload
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
        .then((res) => res?.docs?.[0])) as Tenant

      if (fullTenant?.clientURL) {
        baseURL = `${fullTenant.clientURL}/live-preview`
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Format the URL as needed, based on the document and data
  // I.e. append '/posts' to the URL if the document is a post
  // You can also do this on individual collection or global config, if preferred
  return `${baseURL}${
    collectionConfig && collectionConfig.slug !== 'pages' ? `/${collectionConfig.slug}` : ''
  }${data?.slug && data.slug !== 'home' ? `/${data.slug}` : ''}`
}
