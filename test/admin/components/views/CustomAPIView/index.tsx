import type { DocumentViewServerProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import React from 'react'

export function CustomAPIView(props: DocumentViewServerProps) {
  return (
    <Gutter>
      <div id="custom-api-view">This is a custom API view.</div>
    </Gutter>
  )
}
