/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import React from 'react'
import { Verify, generateMetadata as generateMeta } from '@payloadcms/next/pages/Verify/index'
import { Metadata } from 'next'
import config from '@payload-config'

type Args = {
  params: { [key: string]: string }
}

export const generateMetadata = async (): Promise<Metadata> => generateMeta({ config })

const Page = async ({ params }: Args) => <Verify config={config} token={params.token} />

export default Page
