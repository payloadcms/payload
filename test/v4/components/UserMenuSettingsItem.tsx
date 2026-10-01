'use client'

import { PopupList } from '@payloadcms/ui'
import React from 'react'

export const UserMenuSettingsItem: React.FC = () => {
  return (
    <PopupList.MenuItem>
      <PopupList.Button onClick={() => alert('Custom settings!')}>Custom Settings</PopupList.Button>
    </PopupList.MenuItem>
  )
}
