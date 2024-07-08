'use client'

import { LogOutIcon, useConfig } from '@payloadcms/ui'
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
