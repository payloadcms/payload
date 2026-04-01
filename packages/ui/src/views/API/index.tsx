import type { DocumentViewServerProps } from 'payload'

import React from 'react'

import { APIViewClient } from './index.client.js'

export function APIView(_props: DocumentViewServerProps) {
  return <APIViewClient />
}
