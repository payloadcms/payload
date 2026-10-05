'use client'
import React, { Fragment } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export type CollapseAllToggleProps = {
  controls?: string
  isExpanded?: boolean
  label?: string
  onClick: (collapsed: boolean) => void
}

export const CollapseAllToggle: React.FC<CollapseAllToggleProps> = ({
  controls,
  isExpanded,
  label,
  onClick,
}) => {
  const { t } = useTranslation()

  return (
    <Fragment>
      <li>
        <Button
          aria-controls={controls}
          aria-expanded={isExpanded}
          aria-label={label ? `${t('fields:collapseAll')}: ${label}` : undefined}
          buttonStyle="ghost"
          onClick={() => onClick(true)}
        >
          {t('fields:collapseAll')}
        </Button>
      </li>
      <li>
        <Button
          aria-controls={controls}
          aria-expanded={isExpanded}
          aria-label={label ? `${t('fields:showAll')}: ${label}` : undefined}
          buttonStyle="ghost"
          onClick={() => onClick(false)}
        >
          {t('fields:showAll')}
        </Button>
      </li>
    </Fragment>
  )
}
