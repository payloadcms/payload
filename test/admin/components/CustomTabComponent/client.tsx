'use client'

import { useConfig } from '@payloadcms/ui/providers/Config'
import LinkImport from 'next/link.js'
import { useParams } from 'next/navigation.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const CustomTabComponentClient: React.FC<{
  path: string
}> = ({ path }) => {
  const {
    routes: { admin: adminRoute },
  } = useConfig()
  const params = useParams()

  const baseRoute = (params.segments.slice(0, 3) as string[]).join('/')

  return <Link href={`${adminRoute}/${baseRoute}${path}`}>Custom Tab Component</Link>
}
