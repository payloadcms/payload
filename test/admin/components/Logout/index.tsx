'use client'

import React from 'react'

import { LogOut } from '@payloadcms/ui'
import { useConfig } from '@payloadcms/ui'

export const Logout: React.FC = () => {
  const config = useConfig()
  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config
  return (
    <a href={`${admin}${logoutRoute}#custom`}>
      <LogOut />
    </a>
  )
}
