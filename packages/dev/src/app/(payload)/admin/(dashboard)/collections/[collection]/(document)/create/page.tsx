/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
// import { CollectionList } from '@payloadcms/next/pages/CollectionList'
import { CollectionEdit } from '@payloadcms/next/pages/CollectionEdit'
import config from 'payload-config'

export default ({ params, searchParams }) =>
  CollectionEdit({
    collectionSlug: params.collection,
    searchParams,
    config,
  })
