'use client'

import { PopupList } from '@payloadcms/ui'
import React from 'react'

export const SettingsMenuItem1 = () => {
  return (
    <PopupList.ButtonGroup>
      <PopupList.Button onClick={() => alert('System Settings')}>System Settings</PopupList.Button>
      <PopupList.Button onClick={() => alert('View Logs')}>View Logs</PopupList.Button>
    </PopupList.ButtonGroup>
  )
}
