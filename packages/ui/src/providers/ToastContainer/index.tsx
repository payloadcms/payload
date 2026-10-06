'use client'
import type { ClientConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Toaster } from 'sonner'

import { CheckIcon } from '../../icons/Check/index.js'
import { InfoIcon } from '../../icons/Info/index.js'
import { WarningIcon } from '../../icons/Warning/index.js'
import { XIcon } from '../../icons/X/index.js'
import { getActiveModal } from '../../utilities/getActiveModal.js'
import './index.css'

export const ToastContainer: React.FC<{
  config: ClientConfig
}> = ({ config }) => {
  const { admin: { toast: { duration, expand, limit, position } = {} } = {} } = config

  const { modalState } = useModal()
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  const setCloseIconRef = useCallback((element: HTMLSpanElement | null) => {
    element?.closest('[data-close-button]')?.setAttribute('aria-live', 'off')
  }, [])

  useLayoutEffect(() => {
    const container = document.createElement('div')

    document.body.appendChild(container)
    setPortalContainer(container)
    return () => container.remove()
  }, [])

  useLayoutEffect(() => {
    if (!portalContainer) {
      return
    }
    const updateContainer = () => {
      const activeModal = getActiveModal({ modalState })
      const destination = activeModal ?? document.body

      // Move the portal host, preserving Sonner's mounted state and pending notifications.
      if (portalContainer.parentElement !== destination) {
        destination.appendChild(portalContainer)
      }
    }

    updateContainer()
    const observer = new MutationObserver(updateContainer)

    observer.observe(document.body, {
      attributeFilter: ['open'],
      attributes: true,
      childList: true,
      subtree: true,
    })
    return () => observer.disconnect()
  }, [modalState, portalContainer])

  if (!portalContainer) {
    return null
  }

  return createPortal(
    <Toaster
      className="payload-toast-container"
      closeButton
      // @ts-expect-error - Sonner's `dir` prop is typed as `Direction`, but passing "undefined" opts out of RTL/LTR handling
      dir="undefined"
      duration={duration ?? 6000}
      expand={expand ?? false}
      gap={8}
      icons={{
        close: (
          <span aria-hidden="true" ref={setCloseIconRef} style={{ display: 'contents' }}>
            <XIcon size={24} />
          </span>
        ),
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
    />,
    portalContainer,
  )
}
