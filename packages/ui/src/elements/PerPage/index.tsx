'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import { usePathname, useRouter } from 'next/navigation'
import { collectionDefaults } from 'payload/config'
import qs from 'qs'
import React from 'react'

import { Chevron } from '../../icons/Chevron'
import { useSearchParams } from '../../providers/SearchParams'
import { useTranslation } from '../../providers/Translation'
import Popup from '../Popup'
import * as PopupList from '../Popup/PopupButtonList'
import './index.scss'

const baseClass = 'per-page'

const defaultLimits = collectionDefaults.admin.pagination.limits

export type Props = {
  handleChange?: (limit: number) => void
  limit: number
  limits: number[]
  modifySearchParams?: boolean
  resetPage?: boolean
}

export const PerPage: React.FC<Props> = ({
  handleChange,
  limit,
  limits = defaultLimits,
  modifySearchParams = true,
  resetPage = false,
}) => {
  const { searchParams } = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
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
                  if (modifySearchParams) {
                    const search = qs.stringify(
                      {
                        ...searchParams,
                        limit: limitNumber,
                        page: resetPage ? 1 : searchParams.page,
                      },
                      { addQueryPrefix: true },
                    )

                    router.replace(`${pathname}${search}`)
                  }
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
