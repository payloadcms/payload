import type { DocumentViewServerProps } from 'payload'

import { LivePreviewView } from '@payloadcms/next/views'
import React from 'react'

export const MyLivePreviewView = (props: DocumentViewServerProps) => {
  return <LivePreviewView {...props} />
}
