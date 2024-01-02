/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { CollectionEdit } from '@payloadcms/next/pages/CollectionEdit'
import config from 'payload-config'

export default ({ params, searchParams }) =>
  CollectionEdit({ collectionSlug: params.collection, id: params.id, config, searchParams })
