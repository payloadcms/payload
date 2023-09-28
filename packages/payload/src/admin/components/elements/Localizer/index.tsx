import qs from 'qs'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Chevron } from '../..'
import { useConfig } from '../../utilities/Config'
import { useLocale } from '../../utilities/Locale'
import { useSearchParams } from '../../utilities/SearchParams'
import Popup from '../Popup'
import * as PopupList from '../Popup/PopupButtonList'
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
          horizontalAlign="right"
          render={({ close }) => (
            <PopupList.ButtonGroup>
              {locales.map((localeOption) => {
                const newParams = {
                  ...searchParams,
                  locale: localeOption.code,
                }

                const search = qs.stringify(newParams)

                if (localeOption.code !== locale.code) {
                  return (
                    <PopupList.Button key={locale.code} onClick={close} to={{ search }}>
                      {localeOption.label}
                      {localeOption.label !== localeOption.code && ` (${localeOption.code})`}
                    </PopupList.Button>
                  )
                }

                return null
              })}
            </PopupList.ButtonGroup>
          )}
          showScrollbar
          size="large"
        />
      </div>
    )
  }

  return null
}

export default Localizer
