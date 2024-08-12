/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next'

import config from '@payload-config'
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views/NotFound/index.js'

type Props = {
  params: {
    segments: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

export const generateMetadata = ({ params }: Props): Promise<Metadata> =>
  generatePageMetadata({ config, params })

const NotFound = ({ params, searchParams }: Props) => NotFoundPage({ config, params, searchParams })

export default NotFound
