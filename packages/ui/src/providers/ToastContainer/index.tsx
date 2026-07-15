'use client'
import type { ClientConfig } from 'payload'

import React from 'react'
import { Toaster } from 'sonner'

import { CheckIcon } from '../../icons/Check/index.js'
import { InfoIcon } from '../../icons/Info/index.js'
import { WarningIcon } from '../../icons/Warning/index.js'
import { XIcon } from '../../icons/X/index.js'
import './index.css'

export const ToastContainer: React.FC<{
  config: ClientConfig
}> = ({ config }) => {
  const { admin: { toast: { duration, expand, limit, position } = {} } = {} } = config

  return (
    <Toaster
      className="payload-toast-container"
      closeButton
      // @ts-expect-error - Sonner's `dir` prop is typed as `Direction`, but passing "undefined" opts out of RTL/LTR handling
      dir="undefined"
      duration={duration ?? 4000}
      expand={expand ?? false}
      gap={8}
      icons={{
        close: <XIcon size={24} />,
        error: <WarningIcon />,
        info: <InfoIcon />,
        success: <CheckIcon size={24} />,
        warning: <WarningIcon />,
      }}
      offset={{
        bottom: 'var(--spacer-6)',
        right: 'var(--spacer-6)',
      }}
      position={position ?? 'bottom-right'}
      style={{
        width: '280px',
      }}
      theme="dark"
      toastOptions={{
        classNames: {
          closeButton: 'payload-toast-close-button',
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
