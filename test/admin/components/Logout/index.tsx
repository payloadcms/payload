'use client'

import { LogOut } from '@payloadcms/ui'
import { useConfig } from '@payloadcms/ui'
import React from 'react'

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
