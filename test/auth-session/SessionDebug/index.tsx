'use client'

import type { UIField } from 'payload'

import { useAuth } from '@payloadcms/ui'
import React from 'react'

import { authSessionExpirationTestID } from '../shared.js'

export const SessionDebug: React.FC<UIField> = () => {
  const { tokenExpirationMs, user } = useAuth()

  return (
    <output data-testid={authSessionExpirationTestID} data-user-id={user?.id}>
      {tokenExpirationMs}
    </output>
  )
}
