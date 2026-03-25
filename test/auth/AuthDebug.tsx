'use client'

import type { UIField, User } from 'payload'

import { useAuth } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect, useState } from 'react'

export const AuthDebug: React.FC<UIField> = () => {
  const [state, setState] = useState<null | undefined | User>()
  const [refreshCount, setRefreshCount] = useState(0)
  const { refreshCookieAsync, token, user } = useAuth()

  useEffect(() => {
    const fetchUser = async () => {
      const userRes = await fetch(
        formatAdminURL({
          apiRoute: '/api',
          path: `/users/${user?.id}`,
        }),
      )?.then((res) => res.json())
      setState(userRes)
    }

    if (user?.id) {
      void fetchUser()
    }
  }, [user])

  return (
    <div id="auth-debug">
      <div id="use-auth-result">{user?.custom as string}</div>
      <div id="users-api-result">{state?.custom as string}</div>
      <div id="use-auth-token">{token as string}</div>
      <div id="refresh-count">{refreshCount}</div>
      <button
        id="refresh-auth-cookie"
        onClick={async () => {
          await refreshCookieAsync()
          setRefreshCount((c) => c + 1)
        }}
        type="button"
      >
        Refresh auth cookie
      </button>
    </div>
  )
}
