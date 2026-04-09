'use client'

import type { DocumentTabClientProps } from 'payload'

import { Link, useConfig, useParams } from '@payloadcms/ui'
import React from 'react'

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
