import React from 'react'

import { DrawerCloseButton } from '../DrawerCloseButton/index.js'
import { drawerSlug } from '../index.js'
import './index.scss'

const baseClass = 'bulk-upload--drawer-header'

type Props = {
  readonly title: string
}
export function DrawerHeader({ title }: Props) {
  return (
    <div className={baseClass}>
      <h2 title={title}>{title}</h2>
      <DrawerCloseButton slug={drawerSlug} />
    </div>
  )
}
