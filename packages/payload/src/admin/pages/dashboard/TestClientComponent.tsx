'use client'
import React from 'react'

import type { ClientConfig } from '../../../exports/config'

export const ClientComponent: React.FC<{ config: ClientConfig }> = ({ config }) => {
  return (
    <p>
      This is a test client component and I have received the Payload config via props. No Webpack
      aliases required!
    </p>
  )
}
