'use client'

import { InfoIcon, PopupList } from '@payloadcms/ui'
import React from 'react'

export const UserMenuSettingsItem: React.FC = () => {
  return (
    <PopupList.MenuItem>
      <PopupList.Button icon={<InfoIcon size={24} />} onClick={() => alert('Custom settings!')}>
        Custom Settings
      </PopupList.Button>
    </PopupList.MenuItem>
  )
}
