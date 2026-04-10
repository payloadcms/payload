'use client'

import type { AdminViewProps } from '@payloadcms/tanstack-start/views'

import { AdminView } from '@payloadcms/tanstack-start/views'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { importMap } from '../../importMap.js'

export function AdminPageView(props: { _redirect?: string } & AdminViewProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (props._redirect) {
      void navigate({ to: props._redirect })
    }
  }, [props._redirect, navigate])

  if (props._redirect) {
    return null
  }

  return <AdminView {...props} importMap={importMap} />
}
