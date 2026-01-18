import type { DocumentViewServerProps } from '@ruya.sa/payload'

import React from 'react'

import { APIViewClient } from './index.client.js'

export function APIView(props: DocumentViewServerProps) {
  return <APIViewClient />
}
