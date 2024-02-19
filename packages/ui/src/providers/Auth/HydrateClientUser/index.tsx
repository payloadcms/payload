'use client'

import { useEffect } from 'react'
import { useAuth } from '..'
import { Permissions, User } from 'payload/auth'

export const HydrateClientUser: React.FC<{ user: User; permissions: Permissions }> = ({
  user,
  permissions,
}) => {
  const { setUser, setPermissions } = useAuth()

  useEffect(() => {
    setUser(user)
    setPermissions(permissions)
  }, [user, permissions, setUser, setPermissions])

  return null
}
