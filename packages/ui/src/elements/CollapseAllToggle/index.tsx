'use client'
import React, { Fragment } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export type CollapseAllToggleProps = {
  onClick: (collapsed: boolean) => void
}

export const CollapseAllToggle: React.FC<CollapseAllToggleProps> = ({ onClick }) => {
  const { t } = useTranslation()

  return (
    <Fragment>
      <li>
        <Button buttonStyle="ghost" onClick={() => onClick(true)}>
          {t('fields:collapseAll')}
        </Button>
      </li>
      <li>
        <Button buttonStyle="ghost" onClick={() => onClick(false)}>
          {t('fields:showAll')}
        </Button>
      </li>
    </Fragment>
  )
}
