'use client'

import { LogOutIcon } from '@payloadcms/ui/icons/LogOut'
import { useConfig } from '@payloadcms/ui/providers/Config'
import React from 'react'

export const Logout: React.FC = () => {
  const config = useConfig()
  const {
    admin: {
      routes: { logout: logoutRoute },
    },
    routes: { admin },
  } = config

  return (
    <a href={`${admin}${logoutRoute}#custom`}>
      <LogOutIcon />
    </a>
  )
}
