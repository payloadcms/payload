export const formatLivePreviewURL = async ({ data, documentInfo }) => {
  let baseURL = 'http://localhost:3001'

  // You can run async requests here, if needed
  // For example, multi-tenant apps may need to lookup additional data
  if (data.tenant) {
    try {
      const fullTenant = await fetch(
        `http://localhost:3000/api/tenants?where[id][equals]=${data.tenant}&limit=1&depth=0`,
      )
        .then((res) => res.json())
        .then((res) => res?.docs?.[0])

      baseURL = fullTenant?.clientURL
    } catch (e) {
      console.error(e)
    }
  }

  // Format the URL as needed, based on the document and data
  // I.e. append '/posts' to the URL if the document is a post
  // You can also do this on individual collection or global config, if preferred
  return `${baseURL}${
    documentInfo?.slug && documentInfo.slug !== 'pages' ? `/${documentInfo.slug}` : ''
  }${data?.slug && data.slug !== 'home' ? `/${data.slug}` : ''}`
}
