/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { VersionView } from '@payloadcms/next/pages/Version'
import config from 'payload-config'

export default ({ params, searchParams }) =>
  VersionView({
    collectionSlug: params.collection,
    id: params.id,
    versionID: params.version,
    config,
    searchParams,
  })
