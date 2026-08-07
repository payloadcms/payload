'use client'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export type ClearRowsProps = {
  onClick: () => void
}

export const ClearRows: React.FC<ClearRowsProps> = ({ onClick }) => {
  const { t } = useTranslation()

  return (
    <li>
      <Button buttonStyle="ghost" onClick={onClick}>
        {t('general:clear')}
      </Button>
    </li>
  )
}
