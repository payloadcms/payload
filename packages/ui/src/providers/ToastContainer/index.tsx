'use client'
import React from 'react'
import { Toaster } from 'sonner'

import { useConfig } from '../Config/index.js'
import { Error } from './icons/Error.js'
import { Info } from './icons/Info.js'
import { Success } from './icons/Success.js'
import { Warning } from './icons/Warning.js'

export const ToastContainer: React.FC = () => {
  const {
    config: {
      admin: { toast },
    },
  } = useConfig()

  return (
    <Toaster
      className="payload-toast-container"
      closeButton
      // @ts-expect-error
      dir="undefined"
      duration={toast?.duration ?? 4000}
      expand={toast?.expand ?? false}
      gap={8}
      icons={{
        error: <Error />,
        info: <Info />,
        success: <Success />,
        warning: <Warning />,
      }}
      offset="calc(var(--gutter-h) / 2)"
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
      visibleToasts={toast?.visibleToasts ?? 5}
    />
  )
}
