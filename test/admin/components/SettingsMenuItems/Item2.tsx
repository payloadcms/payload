'use client'

import { PopupList } from '@payloadcms/ui'
import React from 'react'

export const SettingsMenuItem2 = () => {
  return (
    <PopupList.ButtonGroup>
      <PopupList.Button onClick={() => alert('Manage Users')}>Manage Users</PopupList.Button>
      <PopupList.Button onClick={() => alert('View Activity')}>View Activity</PopupList.Button>
    </PopupList.ButtonGroup>
  )
}
