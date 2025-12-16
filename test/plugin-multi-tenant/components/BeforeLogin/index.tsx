'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { useAuth, useRouteCache } from '@payloadcms/ui'
import React, { useState } from 'react'

import './index.scss'

const baseClass = 'before-login'

const testUsers = [
  {
    name: 'Admin (All Tenants)',
    description: 'Access to all tenants',
    email: 'dev@payloadcms.com',
    password: 'test',
  },
  {
    name: 'Blue Dog User',
    description: 'Blue Dog tenant only',
    email: 'jane@blue-dog.com',
    password: 'test',
  },
  {
    name: 'Multi-Tenant Owner',
    description: 'Anchor Bar & Blue Dog tenants',
    email: 'owner@anchorAndBlueDog.com',
    password: 'test',
  },
  {
    name: 'Steel Cat User',
    description: 'Steel Cat tenant only',
    email: 'huel@steel-cat.com',
    password: 'test',
  },
]

export const BeforeLogin: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['beforeLogin'][0]
> = () => {
  const { setUser } = useAuth()
  const [loading, setLoading] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)
  const { clearRouteCache } = useRouteCache()

  const login = React.useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/users/login', {
        body: JSON.stringify(credentials),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`)
      }

      const data = await response.json()
      setUser(data)
      clearRouteCache()
    },
    [setUser, clearRouteCache],
  )

  const handleQuickLogin = async (email: string, password: string) => {
    setLoading(email)
    setError(null)
    try {
      await login({ email, password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(null)
    }
  }

  return (
    <div className={baseClass}>
      <h3 className={`${baseClass}__title`}>Multi-Tenant Test Users</h3>
      <p className={`${baseClass}__description`}>
        Quick login for testing different tenant access patterns
      </p>
      <div className={`${baseClass}__buttons`}>
        {testUsers.map((user) => (
          <button
            className={`${baseClass}__button ${loading === user.email ? `${baseClass}__button--loading` : ''}`}
            disabled={loading !== null}
            key={user.email}
            onClick={() => handleQuickLogin(user.email, user.password)}
            type="button"
          >
            <div className={`${baseClass}__button-name`}>
              {loading === user.email ? 'Logging in...' : user.name}
            </div>
            <div className={`${baseClass}__button-details`}>
              {user.email} • {user.description}
            </div>
          </button>
        ))}
      </div>
      {error && <div className={`${baseClass}__error`}>{error}</div>}
    </div>
  )
}
