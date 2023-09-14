import qs from 'qs'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Chevron } from '../..'
import { useConfig } from '../../utilities/Config'
import { useLocale } from '../../utilities/Locale'
import { useSearchParams } from '../../utilities/SearchParams'
import Popup from '../Popup'
import './index.scss'

const baseClass = 'localizer'

const Localizer: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  const config = useConfig()
  const { localization } = config

  const locale = useLocale()
  const searchParams = useSearchParams()
  const { t } = useTranslation('general')

  if (localization) {
    const { locales } = localization

    return (
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <div className={`${baseClass}__label`}>{`${t('locale')}:`}</div>
        &nbsp;&nbsp;
        <Popup
          button={
            <div className={`${baseClass}__button`}>
              {`${locale.label}`}
              <Chevron className={`${baseClass}__chevron`} />
            </div>
          }
          horizontalAlign="left"
          render={({ close }) => (
            <ul>
              {locales.map((localeOption) => {
                const baseLocaleClass = `${baseClass}__locale`

                const localeClasses = [
                  baseLocaleClass,
                  locale.code === localeOption.code && `${baseLocaleClass}--active`,
                ]
                  .filter(Boolean)
                  .join('')

                const newParams = {
                  ...searchParams,
                  locale: localeOption.code,
                }

                const search = qs.stringify(newParams)

                if (localeOption.code !== locale.code) {
                  return (
                    <li className={localeClasses} key={localeOption.code}>
                      <Link onClick={close} to={{ search }}>
                        {localeOption.label}
                      </Link>
                    </li>
                  )
                }

                return null
              })}
            </ul>
          )}
          showScrollbar
        />
      </div>
    )
  }

  return null
}

export default Localizer
