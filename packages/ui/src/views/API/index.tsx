import type { DocumentViewServerProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { APIViewClient } from '../../exports/client/index.js'

export function APIView(props: DocumentViewServerProps) {
  return <APIViewClient />
}
