import React from 'react'

import './index.css'

const baseClass = 'upload-field-card'

type Props = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly readOnly?: boolean
  readonly size?: 'medium' | 'small'
}
export function UploadCard({ children, className, readOnly, size = 'medium' }: Props) {
  return (
    <div
      className={[
        baseClass,
        className,
        `${baseClass}--size-${size}`,
        readOnly && `${baseClass}--readOnly`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
