'use client'
import React from 'react'

import './index.scss'
import { sanitizeID } from '../../utilities/sanitizeID.js'

const baseClass = 'id-label'

export const IDLabel: React.FC<{ className?: string; id: string; prefix?: string }> = ({
  id,
  className,
  prefix = 'ID:',
}) => (
  <div className={[baseClass, className].filter(Boolean).join(' ')} title={id}>
    {prefix}
    &nbsp;
    {sanitizeID(id)}
  </div>
)
