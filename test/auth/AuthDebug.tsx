'use client'

import React, { useEffect, useState } from 'react'

import type { User } from '../../packages/payload/src/auth/types.js'
import type { UIField } from '../../packages/payload/src/fields/config/types.js'

import { useAuth } from '../../packages/ui/src/providers/Auth/index.js'

export const AuthDebug: React.FC<UIField> = () => {
  const [state, setState] = useState<User | null | undefined>()
  const { user } = useAuth()

  useEffect(() => {
    const fetchUser = async () => {
      const userRes = await fetch(`/api/users/${user?.id}`)?.then((res) => res.json())
      setState(userRes)
    }

    void fetchUser()
  }, [user])

  return (
    <div id="auth-debug">
      <div id="use-auth-result">{user?.custom as string}</div>
      <div id="users-api-result">{state?.custom as string}</div>
    </div>
  )
}
