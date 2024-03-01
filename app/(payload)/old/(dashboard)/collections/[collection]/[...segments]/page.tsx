/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { Document, generateMetadata as generateMeta } from '@payloadcms/next/pages/Document/index'
import config from '@payload-config'

type Args = {
  params: {
    collection: string
    global: string
    segments: string[]
  }
  searchParams: { [key: string]: string | string[] }
}

export const generateMetadata = async ({ params }: Args) => generateMeta({ config, params })

const Page: React.FC<Args> = ({ params, searchParams }) =>
  Document({
    params,
    searchParams,
    config,
  })

export default Page
