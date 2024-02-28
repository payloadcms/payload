/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { ListView, generateMetadata as generateMeta } from '@payloadcms/next/pages/List'
import config from '@payload-config'

export const generateMetadata = async ({ params }) => generateMeta({ config, params })

export default ({ params, searchParams }) =>
  ListView({
    collectionSlug: params.collection,
    searchParams,
    config,
    route: `/collections/${params.collection + (params.segments?.length ? `/${params.segments.join('/')}` : '')}`,
  })
