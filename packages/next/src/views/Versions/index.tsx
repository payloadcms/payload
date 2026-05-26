import type { DocumentViewServerProps } from 'payload'

import { VersionsView as VersionsViewBase } from '@payloadcms/ui/views/Versions'
import { notFound } from 'next/navigation.js'
import React from 'react'

export function VersionsView(props: DocumentViewServerProps) {
  return <VersionsViewBase {...props} onNotFound={notFound} />
}
