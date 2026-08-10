'use client'

import { PopupList } from '@payloadcms/ui'
import React from 'react'

export const UserMenuSettingsItemLegacy: React.FC = () => {
  return (
    <PopupList.MenuItem>
      <PopupList.Button onClick={() => alert('Legacy settings!')}>Legacy Settings</PopupList.Button>
    </PopupList.MenuItem>
  )
}
