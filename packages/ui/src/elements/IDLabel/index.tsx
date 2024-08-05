'use client'
import React from 'react'

import './index.scss'

const baseClass = 'id-label'

export const IDLabel: React.FC<{ className?: string; id: string; prefix?: string }> = ({
  id,
  className,
  prefix = 'ID:',
}) => (
  <div className={[baseClass, className].filter(Boolean).join(' ')} title={id}>
    {prefix}
    &nbsp;
    {id}
  </div>
)
