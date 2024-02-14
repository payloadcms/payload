/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { Logout, generateMetadata as generateMeta } from '@payloadcms/next/pages/Logout'
import { Metadata } from 'next'
import config from 'payload-config'

export const generateMetadata = async (): Promise<Metadata> => generateMeta({ config })

export default async ({ searchParams }) => (
  <Logout config={config} searchParams={searchParams} inactivity />
)
