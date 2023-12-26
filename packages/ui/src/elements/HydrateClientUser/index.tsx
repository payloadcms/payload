'use client'

import { useEffect } from 'react'
import { useAuth } from '../../providers/Auth'

export const HydrateClientUser: React.FC<{ user: any }> = ({ user }) => {
  const { setUser } = useAuth()

  useEffect(() => {
    setUser(user)
  }, [user])

  return null
}
