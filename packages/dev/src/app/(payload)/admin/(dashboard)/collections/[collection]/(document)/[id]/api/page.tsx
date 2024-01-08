/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { APIView } from '@payloadcms/next/pages/API'
import config from 'payload-config'

export default ({ params, searchParams }) =>
  APIView({
    collectionSlug: params.collection,
    id: params.id,
    config,
    searchParams,
  })
