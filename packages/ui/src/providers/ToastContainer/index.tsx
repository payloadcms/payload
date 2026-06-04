'use client'
import type { ClientConfig } from 'payload'

import React from 'react'
import { Toaster } from 'sonner'

import { InfoIcon } from '../../icons/Info/index.js'
import { SuccessIcon } from '../../icons/Success/index.js'
import { WarningIcon } from '../../icons/Warning/index.js'
import './index.css'

export const ToastContainer: React.FC<{
  config: ClientConfig
}> = ({ config }) => {
  const { admin: { toast: { duration, expand, limit, position } = {} } = {} } = config

  return (
    <Toaster
      className="payload-toast-container"
      // @ts-expect-error
      dir="undefined"
      duration={duration ?? Infinity ?? 4000}
      expand={expand ?? true}
      gap={8}
      icons={{
        error: <WarningIcon />,
        info: <InfoIcon />,
        success: <SuccessIcon />,
        warning: <WarningIcon />,
      }}
      offset="calc(var(--gutter-h) / 2)"
      position={position ?? 'bottom-center'}
      toastOptions={{
        classNames: {
          content: 'toast-content',
          error: 'toast-error',
          icon: 'toast-icon',
          info: 'toast-info',
          success: 'toast-success',
          title: 'toast-title',
          toast: 'payload-toast-item',
          warning: 'toast-warning',
        },
        unstyled: true,
      }}
      visibleToasts={limit ?? 5}
    />
  )
}
