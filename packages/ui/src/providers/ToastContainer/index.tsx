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
  const [announcement, setAnnouncement] = useState({ sequence: 0, text: '' })
  const setToasterRef = useCallback((element: HTMLElement | null) => {
    // Sonner's live region includes the close and action controls. Announce only its message below.
    element?.setAttribute('aria-live', 'off')
  }, [])

  useLayoutEffect(() => {
    if (!portalContainer) {
      return
    }

    const announcedMessages = new WeakMap<Element, string>()
    let announcementSources = new Map<Element, string>()
    const announceMessages = () => {
      const messages = new Map<Element, string>()
      const currentMessages = new Map<Element, string>()

      for (const notification of portalContainer.querySelectorAll('[data-sonner-toast]')) {
        const content = notification.querySelector('[data-content], .toast-content') ?? notification
        const message = content.cloneNode(true) as HTMLElement

        message
          .querySelectorAll(
            'button, [role="button"], input, select, textarea, [aria-hidden="true"], [hidden], [data-icon]',
          )
          .forEach((control) => control.remove())
        const walker = document.createTreeWalker(message, NodeFilter.SHOW_TEXT)
        const parts: string[] = []
        let node: Node | null

        while ((node = walker.nextNode())) {
          const part = node.textContent?.trim()

          if (part) {
            parts.push(part)
          }
        }
        const text = parts.join(' ')

        if (text) {
          currentMessages.set(notification, text)
          if (announcedMessages.get(notification) !== text) {
            messages.set(notification, text)
          }
        }
        announcedMessages.set(notification, text)
      }

      const remainingSources = new Map(
        [...announcementSources].filter(([source]) => currentMessages.has(source)),
      )

      if (messages.size || remainingSources.size !== announcementSources.size) {
        announcementSources = messages.size ? messages : remainingSources
        setAnnouncement((previous) => ({
          sequence: previous.sequence + 1,
          text: [...announcementSources.values()].join(' '),
        }))
      }
    }
    // Observe rendered messages so custom React titles and promise updates are announced too.
    const observer = new MutationObserver(announceMessages)

    observer.observe(portalContainer, { characterData: true, childList: true, subtree: true })
    announceMessages()
    return () => observer.disconnect()
  }, [portalContainer])

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
    <>
      <span aria-atomic="true" className="sr-only" role="status">
        <span key={announcement.sequence}>{announcement.text}</span>
      </span>
      <Toaster
        className="payload-toast-container"
        closeButton
        // @ts-expect-error - Sonner's `dir` prop is typed as `Direction`, but passing "undefined" opts out of RTL/LTR handling
        dir="undefined"
        duration={duration ?? 6000}
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
        ref={setToasterRef}
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
    </>,
    portalContainer,
  )
}
