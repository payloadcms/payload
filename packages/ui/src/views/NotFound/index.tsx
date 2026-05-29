import type { AdminViewServerProps } from 'payload'

import React from 'react'

import { NotFoundClient } from './index.client.js'

export { NotFoundClient }

export function NotFoundView(_props: AdminViewServerProps) {
  return <NotFoundClient />
}
