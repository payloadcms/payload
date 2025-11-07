'use client'
import { PopupList, useConfig } from '@payloadcms/ui'
import React from 'react'

export const DefaultSystemInfoItem: React.FC = () => {
  const {
    config: {
      admin: {
        routes: { systemInfo },
      },
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <PopupList.ButtonGroup>
      <PopupList.Button href={`${adminRoute}${systemInfo}`}>System Info</PopupList.Button>
    </PopupList.ButtonGroup>
  )
}
