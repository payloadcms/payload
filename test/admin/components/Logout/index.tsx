'use client'

import { LogOutIcon, PopupList, useConfig } from '@payloadcms/ui'
import React from 'react'

export const Logout: React.FC = () => {
  const {
    config: {
      admin: {
        routes: { logout: logoutRoute },
      },
      routes: { admin },
    },
  } = useConfig()

  return (
    <a aria-label="Custom Logout" href={`${admin}${logoutRoute}#custom`}>
      <PopupList.Button className="logout-button" icon={<LogOutIcon />}>
        Custom Logout
      </PopupList.Button>
    </a>
  )
}
