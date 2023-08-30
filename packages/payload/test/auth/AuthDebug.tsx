import React, { useEffect, useState } from 'react'

import type { User } from '../../src/auth/types.js'
import type { UIField } from '../../src/fields/config/types.js'

import { useAuth } from '../../src/admin/components/utilities/Auth/index.js'

export const AuthDebug: React.FC<UIField> = () => {
  const [state, setState] = useState<User | null | undefined>()
  const { user } = useAuth()

  useEffect(() => {
    const fetchUser = async () => {
      const userRes = await fetch(`/api/users/${user?.id}`)?.then((res) => res.json())
      setState(userRes)
    }

    fetchUser()
  }, [user])

  return (
    <div id="auth-debug">
      <div id="use-auth-result">{user?.custom as string}</div>
      <div id="users-api-result">{state?.custom as string}</div>
    </div>
  )
}
