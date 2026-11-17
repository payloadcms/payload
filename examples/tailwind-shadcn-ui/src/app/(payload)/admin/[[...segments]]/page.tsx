/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import config from '@payload-config'
import { RootPage } from '@payloadcms/next/views'

type Args = {
  params: {
    segments: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

const Page = ({ params, searchParams }: Args) => RootPage({ config, params, searchParams })

export default Page
