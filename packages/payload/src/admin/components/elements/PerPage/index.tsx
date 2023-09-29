import qs from 'qs'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import { defaults } from '../../../../collections/config/defaults'
import Chevron from '../../icons/Chevron'
import { useSearchParams } from '../../utilities/SearchParams'
import Popup from '../Popup'
import './index.scss'

const baseClass = 'per-page'

const defaultLimits = defaults.admin.pagination.limits

export type Props = {
  handleChange?: (limit: number) => void
  limit: number
  limits: number[]
  modifySearchParams?: boolean
  resetPage?: boolean
}

const PerPage: React.FC<Props> = ({
  handleChange,
  limit,
  limits = defaultLimits,
  modifySearchParams = true,
  resetPage = false,
}) => {
  const params = useSearchParams()
  const history = useHistory()
  const { t } = useTranslation('general')

  return (
    <div className={baseClass}>
      <Popup
        button={
          <div className={`${baseClass}__base-button`}>
            <span>{t('perPage', { limit })}</span>
            {<Chevron className={`${baseClass}__icon`} />}
          </div>
        }
        horizontalAlign="right"
        render={({ close }) => (
          <div>
            <ul>
              {limits.map((limitNumber, i) => (
                <li className={`${baseClass}-item`} key={i}>
                  <button
                    className={[
                      `${baseClass}__button`,
                      limitNumber === Number(limit) && `${baseClass}__button-active`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      close()
                      if (handleChange) handleChange(limitNumber)
                      if (modifySearchParams) {
                        history.replace({
                          search: qs.stringify(
                            {
                              ...params,
                              limit: limitNumber,
                              page: resetPage ? 1 : params.page,
                            },
                            { addQueryPrefix: true },
                          ),
                        })
                      }
                    }}
                    type="button"
                  >
                    {limitNumber === Number(limit) && (
                      <Chevron className={`${baseClass}__popup-icon`} direction="right" />
                    )}
                    {limitNumber}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      />
    </div>
  )
}

export default PerPage
