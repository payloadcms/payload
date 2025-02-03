'use client'

import React from 'react'

import { DrawerCloseButton } from '../DrawerCloseButton/index.js'
import './index.scss'

const baseClass = 'bulk-upload--drawer-header'

type Props = {
  readonly onClose: () => void
  readonly title: string
}
export function DrawerHeader({ onClose, title }: Props) {
  return (
    <div className={baseClass}>
      <h2 title={title}>{title}</h2>
      <DrawerCloseButton onClick={onClose} />
    </div>
  )
}
