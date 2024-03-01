/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import React from 'react'
import { Login, generateMetadata as generateMeta } from '@payloadcms/next/pages/Login/index'
import { Metadata } from 'next'
import config from '@payload-config'

type Args = {
  searchParams: { [key: string]: string | string[] }
}

export const generateMetadata = async (): Promise<Metadata> => generateMeta({ config })

const Page = async ({ searchParams }: Args) => <Login config={config} searchParams={searchParams} />

export default Page
