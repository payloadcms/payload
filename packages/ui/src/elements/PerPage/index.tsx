'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import { collectionDefaults, isNumber } from 'payload/shared'
import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'

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
      <Popup
        button={
          <div className={`${baseClass}__base-button`}>
            <span>{t('general:perPage', { limit: limitToUse })}</span>
            &nbsp;
            <ChevronIcon className={`${baseClass}__icon`} />
          </div>
        }
        horizontalAlign="right"
        render={({ close }) => (
          <PopupList.ButtonGroup>
            {limits.map((limitNumber, i) => (
              <PopupList.Button
                className={[
                  `${baseClass}__button`,
                  limitNumber === limitToUse && `${baseClass}__button-active`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={i}
                onClick={() => {
                  close()
                  if (handleChange) {
                    handleChange(limitNumber)
                  }
                }}
              >
                {limitNumber === limitToUse && (
                  <div className={`${baseClass}__chevron`}>
                    <ChevronIcon direction="right" size="small" />
                  </div>
                )}
                &nbsp;
                <span>{limitNumber}</span>
              </PopupList.Button>
            ))}
          </PopupList.ButtonGroup>
        )}
        size="small"
      />
    </div>
  )
}
