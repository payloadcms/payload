'use client'

import type { AdminViewProps } from '@payloadcms/tanstack-start/views'

import { AdminView } from '@payloadcms/tanstack-start/views'

import { importMap } from '../../importMap.js'

export function AdminPageView(props: AdminViewProps) {
  return <AdminView {...props} importMap={importMap} />
}
