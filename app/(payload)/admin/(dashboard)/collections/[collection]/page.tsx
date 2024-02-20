/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { CollectionList } from '@payloadcms/next/pages/CollectionList'
import config from 'payload-config'

export default ({ params, searchParams }) =>
  CollectionList({
    collectionSlug: params.collection,
    searchParams,
    config,
    route: `/${params.collection + '/' + params.segments?.join('/')}`,
  })
