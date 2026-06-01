'use client'
import { collectionDefaults, isNumber } from 'payload/shared'
import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.css'

const baseClass = 'per-page'

const defaultLimits = collectionDefaults.admin.pagination.limits

export type PerPageProps = {
  readonly defaultLimit?: number
  readonly handleChange?: (limit: number) => void
  readonly limit: number
  readonly limits: number[]
  readonly resetPage?: boolean
}

export const PerPage: React.FC<PerPageProps> = ({
  defaultLimit = 10,
  handleChange,
  limit,
  limits = defaultLimits,
}) => {
  const { t } = useTranslation()

  const limitToUse = isNumber(limit) ? limit : defaultLimit

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__label`}>{t('general:perPageLabel')}</span>
      <Popup
        horizontalAlign="right"
        render={({ close }) => (
          <PopupList.RadioGroup>
            {limits.map((limitNumber, i) => (
              <PopupList.RadioGroupItem
                active={limitNumber === limitToUse}
                key={i}
                onClick={() => {
                  close()
                  if (handleChange) {
                    handleChange(limitNumber)
                  }
                }}
              >
                {limitNumber}
              </PopupList.RadioGroupItem>
            ))}
          </PopupList.RadioGroup>
        )}
        renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
          <Button
            {...ariaProps}
            buttonStyle="secondary"
            className={[active && `${baseClass}--active`].filter(Boolean).join(' ')}
            extraButtonProps={{ onKeyDown }}
            icon={<ChevronIcon className={`${baseClass}__icon`} size={16} />}
            iconPosition="right"
            onClick={onClick}
          >
            {limitToUse}
          </Button>
        )}
        size="small"
      />
    </div>
  )
}
