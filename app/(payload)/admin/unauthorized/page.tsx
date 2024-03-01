/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import React from 'react'
import {
  Unauthorized,
  generateMetadata as generateMeta,
} from '@payloadcms/next/pages/Unauthorized/index'
import { Metadata } from 'next'
import config from '@payload-config'

export const generateMetadata = async (): Promise<Metadata> => generateMeta({ config })

const Page = async () => <Unauthorized config={config} />

export default Page
