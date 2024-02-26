'use client'

import type { Permissions, User } from 'payload/auth'

import { useEffect } from 'react'

import { useAuth } from '../../providers/Auth'

export const HydrateClientUser: React.FC<{ permissions: Permissions; user: User }> = ({
  permissions,
  user,
}) => {
  const { setPermissions, setUser } = useAuth()

  useEffect(() => {
    setUser(user)
    setPermissions(permissions)
  }, [user, permissions, setUser, setPermissions])

  return null
}
