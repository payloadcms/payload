import React from 'react'

import './index.scss'

const baseClass = 'upload-field-row-card'

type Props = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly size?: 'medium' | 'small'
}
export function RowCard({ children, className, size = 'medium' }: Props) {
  return (
    <div className={[baseClass, className, `${baseClass}--size-${size}`].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
