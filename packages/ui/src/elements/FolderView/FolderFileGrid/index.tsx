import React from 'react'

import './index.scss'

const baseClass = 'folder-file-grid'

export function FolderFileGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`${baseClass} ${className}`.trim()}>{children}</div>
}
