import React from 'react'

import { DrawerCloseButton } from '../DrawerCloseButton/index.js'
import './index.scss'

const baseClass = 'bulk-upload--drawer-header'

type Props = {
  readonly onClose: () => void
  readonly slug: string
  readonly title: string
}
export function DrawerHeader({ slug, onClose, title }: Props) {
  return (
    <div className={baseClass}>
      <h2 title={title}>{title}</h2>
      <DrawerCloseButton onClick={onClose} slug={slug} />
    </div>
  )
}
