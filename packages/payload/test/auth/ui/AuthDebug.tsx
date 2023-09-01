import React, { useEffect, useState } from 'react'

import type { User } from '../../../src/auth'
import type { UIField } from '../../../src/fields/config/types'

import { useAuth } from '../../../src/admin/components/utilities/Auth'

export const AuthDebug: React.FC<UIField> = () => {
  const [state, setState] = useState<User | null | undefined>()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetch(`/api/users/${user.id}`)
        .then((r) => r.json())
        .then((newUser) => {
          setState(newUser)
        })
    }
  }, [user])

  return (
    <div id="auth-debug-ui-field">
      <div id="users-api-result">{state?.custom as string}</div>
      <div id="use-auth-result">{user?.custom as string}</div>
    </div>
  )
}
