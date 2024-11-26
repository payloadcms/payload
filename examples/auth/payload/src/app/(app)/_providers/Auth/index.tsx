'use client'

import type { SanitizedPermissions } from 'payload'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { User } from '../../../../payload-types'
import type { AuthContext, Create, ForgotPassword, Login, Logout, ResetPassword } from './types'

import { rest } from './rest'

const Context = createContext({} as AuthContext)

export const AuthProvider: React.FC<{
  children: React.ReactNode
  permissions: null | SanitizedPermissions
  user: null | User
}> = ({ children, permissions: permissionsFromProps, user: initialUser }) => {
  const [user, setUser] = useState<null | undefined | User>(initialUser)
  const [permissions, setPermissions] = useState<null | SanitizedPermissions>(permissionsFromProps)

  const create = useCallback<Create>(async (args) => {
    const user = await rest<User>(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users`, args)
    setUser(user)
    return user
  }, [])

  const login = useCallback<Login>(async (args) => {
    const user = await rest<User>(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/login`, args)
    setUser(user)
    return user
  }, [])

  const logout = useCallback<Logout>(async () => {
    await rest(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/logout`)
    setUser(null)
    return
  }, [])

  // On mount, get user and set
  useEffect(() => {
    const fetchMe = async () => {
      const user = await rest<User>(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`,
        {},
        {
          method: 'GET',
        },
      )
      setUser(user)
    }

    void fetchMe()
  }, [])

  const forgotPassword = useCallback<ForgotPassword>(async (args) => {
    const user = await rest<User>(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/forgot-password`,
      args,
    )
    setUser(user)
    return user
  }, [])

  const resetPassword = useCallback<ResetPassword>(async (args) => {
    const user = await rest<User>(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/reset-password`,
      args,
    )
    setUser(user)
    return user
  }, [])

  return (
    <Context.Provider
      value={{
        create,
        forgotPassword,
        login,
        logout,
        permissions,
        resetPassword,
        setPermissions,
        setUser,
        user,
      }}
    >
      {children}
    </Context.Provider>
  )
}

type UseAuth = () => AuthContext

export const useAuth: UseAuth = () => useContext(Context)
