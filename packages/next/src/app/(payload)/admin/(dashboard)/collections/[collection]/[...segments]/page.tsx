/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { Document, generateMetadata as generateMeta } from '@payloadcms/next/pages/Document'
import config from '@payload-config'

export const generateMetadata = async ({ params }) => generateMeta({ config, params })

export default ({ params, searchParams }) =>
  Document({
    params,
    searchParams,
    config,
  })
