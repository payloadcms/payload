import React from 'react'

import './index.scss'

const baseClass = 'drawer-content-container'

type Props = {
  readonly children: React.ReactNode
  readonly className?: string
}
export function DrawerContentContainer({ children, className }: Props) {
  return <div className={[baseClass, className].filter(Boolean).join(' ')}>{children}</div>
}
