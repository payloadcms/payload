'use client'

import type { Permissions } from 'payload/auth'
import type { PayloadRequestWithData } from 'payload/types'

import { useEffect } from 'react'

import { useAuth } from '../../_providers/Auth'

export const HydrateClientUser: React.FC<{
  permissions: Permissions
  user: PayloadRequestWithData['user']
}> = ({ permissions, user }) => {
  const { setPermissions, setUser } = useAuth()

  useEffect(() => {
    setUser(user)
    setPermissions(permissions)
  }, [user, permissions, setUser, setPermissions])

  return null
}
