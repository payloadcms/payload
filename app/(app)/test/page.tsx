import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'

export const Page = async ({ params, searchParams }) => {
  const payload = await getPayloadHMR({
    config: configPromise,
  })
  return <div>test ${payload?.config?.collections?.length}</div>
}

export default Page
