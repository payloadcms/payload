/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next'

import config from '@payload-config'
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'

type Args = {
  params: {
    segments: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) => RootPage({ config, params, searchParams })

export default Page
