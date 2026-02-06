'use client'

import type { DocumentTabClientProps } from 'payload'

import { useConfig } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import { useParams } from 'next/navigation.js'
import React from 'react'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

type CustomTabComponentClientProps = {
  label: string
} & DocumentTabClientProps

export function CustomTabComponentClient({ label, path }: CustomTabComponentClientProps) {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const params = useParams()

  const baseRoute = (params.segments?.slice(0, 3) as string[]).join('/')

  return <Link href={`${adminRoute}/${baseRoute}${path}`}>{label}</Link>
}
