'use client'

import { useConfig } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import { useParams } from 'next/navigation.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const CustomTabComponentClient: React.FC<{
  readonly path: string
}> = ({ path }) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const params = useParams()

  const baseRoute = (params.segments.slice(0, 3) as string[]).join('/')

  return <Link href={`${adminRoute}/${baseRoute}${path}`}>Custom Tab Component</Link>
}
