'use client'

import { PopupList } from '@payloadcms/ui'
import React from 'react'

export const SettingsMenuItem: React.FC = () => {
  return (
    <PopupList.ButtonGroup>
      <PopupList.Button onClick={() => alert('Test')}>Test Button One</PopupList.Button>
      <PopupList.Button onClick={() => alert('Test Two')}>Test Button Two</PopupList.Button>
    </PopupList.ButtonGroup>
  )
}
