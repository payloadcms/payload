import { Gutter } from '@payloadcms/ui'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function VerifyView({ pageState }: { pageState: SerializablePageState }) {
  return (
    <Gutter>
      <h2>{pageState.pageData?.verify?.message}</h2>
    </Gutter>
  )
}
