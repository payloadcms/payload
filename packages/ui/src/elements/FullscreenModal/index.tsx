'use client'
import type { Modal as ModalType } from '@faceless-ui/modal'

import { Modal } from '@faceless-ui/modal'
import React from 'react'

import { useDrawerDepth } from '../../providers/DrawerDepth/index.js'

export function FullscreenModal(props: Parameters<typeof ModalType>[0]) {
  const currentDrawerDepth = useDrawerDepth()

  return (
    <Modal
      {...props}
      style={{
        ...(props.style || {}),
        zIndex: `calc(100 + ${currentDrawerDepth || 0} + 1)`,
      }}
    />
  )
}
