'use client'
import type { ComponentProps } from 'react'

import { Modal } from '@faceless-ui/modal'
import React, { createContext, use, useEffect, useState } from 'react'

import { drawerZBase, useDrawerDepth } from '../../Drawer/index.js'
import { DialogContext } from '../context.js'
import '../index.css'

type FocusTrapOptions = ComponentProps<typeof Modal>['focusTrapOptions']

const baseClass = 'dialog'

export type DialogSize = 'large' | 'medium' | 'small'

export type DialogModalProps = {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly closeOnBlur?: boolean
  readonly closeOnEsc?: boolean
  readonly focusTrapOptions?: FocusTrapOptions
  readonly size?: DialogSize
  readonly slug: string
}

export const DialogModal: React.FC<DialogModalProps> = ({
  slug,
  children,
  className,
  closeOnBlur = false,
  closeOnEsc = true,
  focusTrapOptions,
  size = 'small',
}) => {
  const [isConfirming, setConfirming] = useState(false)
  const drawerDepth = useDrawerDepth()
  const dialogDepth = useDialogDepth()

  useEffect(() => {
    if (closeOnEsc) {
      return
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        e.preventDefault()
      }
    }

    // Capture phase fires before ModalProvider's bubble-phase listener
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [closeOnEsc])

  return (
    <DialogDepthProvider>
      <DialogContext value={{ slug, isConfirming, setConfirming }}>
        <Modal
          closeOnBlur={closeOnBlur}
          focusTrapOptions={focusTrapOptions}
          slug={slug}
          style={{ zIndex: drawerZBase + drawerDepth + dialogDepth + 1 }}
        >
          <div
            className={[baseClass, `${baseClass}--${size}`, className].filter(Boolean).join(' ')}
            role="document"
          >
            {children}
          </div>
        </Modal>
      </DialogContext>
    </DialogDepthProvider>
  )
}

export const DialogDepthContext = createContext(0)

export const useDialogDepth = (): number => use(DialogDepthContext)

export const DialogDepthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parentDepth = useDialogDepth()
  const depth = parentDepth + 1

  return <DialogDepthContext value={depth}>{children}</DialogDepthContext>
}
