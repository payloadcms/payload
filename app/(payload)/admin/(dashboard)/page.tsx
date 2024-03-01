/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { Dashboard, generateMetadata as generateMeta } from '@payloadcms/next/pages/Dashboard/index'
import { Metadata } from 'next'
import config from '@payload-config'

type Args = {
  searchParams: {
    [key: string]: string | string[]
  }
}

export const generateMetadata = async (): Promise<Metadata> => generateMeta({ config })

const Page: React.FC<Args> = async ({ searchParams }) => Dashboard({ config, searchParams })

export default Page
