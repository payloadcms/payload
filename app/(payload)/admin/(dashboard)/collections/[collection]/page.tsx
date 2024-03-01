/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { ListView, generateMetadata as generateMeta } from '@payloadcms/next/pages/List/index'
import config from '@payload-config'

type Args = {
  params: {
    collection: string
    [key: string]: string | string[]
  }
  searchParams: { [key: string]: string | string[] }
}

export const generateMetadata = async ({ params }: Args) => generateMeta({ config, params })

const Page: React.FC<Args> = ({ params, searchParams }) =>
  ListView({
    collectionSlug: params.collection,
    searchParams,
    config,
    route: `/collections/${params.collection + (Array.isArray(params.segments) && params.segments?.length ? `/${params.segments.join('/')}` : '')}`,
  })

export default Page
