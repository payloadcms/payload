'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import { collectionDefaults } from 'payload/config'
import React from 'react'

import { Chevron } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'per-page'

const defaultLimits = collectionDefaults.admin.pagination.limits

export type PerPageProps = {
  handleChange?: (limit: number) => void
  limit: number
  limits: number[]
  resetPage?: boolean
}

export const PerPage: React.FC<PerPageProps> = ({
  handleChange,
  limit,
  limits = defaultLimits,
}) => {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <Popup
        button={
          <div className={`${baseClass}__base-button`}>
            <span>{t('general:perPage', { limit })}</span>
            &nbsp;
            <Chevron className={`${baseClass}__icon`} />
          </div>
        }
        horizontalAlign="right"
        render={({ close }) => (
          <PopupList.ButtonGroup>
            {limits.map((limitNumber, i) => (
              <PopupList.Button
                className={[
                  `${baseClass}__button`,
                  limitNumber === Number(limit) && `${baseClass}__button-active`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={i}
                onClick={() => {
                  close()
                  if (handleChange) handleChange(limitNumber)
                }}
              >
                {limitNumber === Number(limit) && (
                  <div className={`${baseClass}__chevron`}>
                    <Chevron direction="right" />
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
