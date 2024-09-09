'use client'
import type { Modal as ModalType } from '@faceless-ui/modal'

import { Modal } from '@faceless-ui/modal'
import React from 'react'

import { useEditDepth } from '../../providers/EditDepth/index.js'

export function FullscreenModal(props: Parameters<typeof ModalType>[0]) {
  const currentDepth = useEditDepth()

  return (
    <Modal
      {...props}
      style={{
        ...(props.style || {}),
        zIndex: `calc(100 + ${currentDepth || 0} + 1)`,
      }}
    />
  )
}
