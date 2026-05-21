'use client'
import { Button } from '@payloadcms/ui'
import React from 'react'

export const HeaderAction: React.FC = () => {
  return (
    <Button buttonStyle="pill" onClick={() => alert('Header action clicked!')}>
      Action
    </Button>
  )
}

export const HeaderAction2: React.FC = () => {
  return (
    <Button buttonStyle="secondary" onClick={() => alert('Second action!')}>
      Settings
    </Button>
  )
}
