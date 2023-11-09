import qs from 'qs'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { getTranslation } from '../../../../utilities/getTranslation'
import { useConfig } from '../../utilities/Config'
import { useLocale } from '../../utilities/Locale'
import { useSearchParams } from '../../utilities/SearchParams'
import Popup from '../Popup'
import * as PopupList from '../Popup/PopupButtonList'
import { LocalizerLabel } from './LocalizerLabel'
import './index.scss'

const baseClass = 'localizer'

const Localizer: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  const config = useConfig()
  const { localization } = config

  const { i18n } = useTranslation()
  const locale = useLocale()
  const searchParams = useSearchParams()

  const localeLabel = getTranslation(locale.label, i18n)

  if (localization) {
    const { locales } = localization

    return (
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Popup
          button={<LocalizerLabel />}
          horizontalAlign="right"
          render={({ close }) => (
            <PopupList.ButtonGroup>
              <React.Fragment>
                {locale ? (
                  <PopupList.Button
                    active
                    key={locale.code}
                    onClick={close}
                    to={{
                      search: qs.stringify({
                        ...searchParams,
                        locale: locale.code,
                      }),
                    }}
                  >
                    {localeLabel}
                    {localeLabel !== locale.code && ` (${locale.code})`}
                  </PopupList.Button>
                ) : null}

                {locales.map((localeOption) => {
                  if (locale.code === localeOption.code) return null

                  const newParams = {
                    ...searchParams,
                    locale: localeOption.code,
                  }
                  const search = qs.stringify(newParams)
                  const localeOptionLabel = getTranslation(localeOption.label, i18n)

                  return (
                    <PopupList.Button key={localeOption.code} onClick={close} to={{ search }}>
                      {localeOptionLabel}
                      {localeOptionLabel !== localeOption.code && ` (${localeOption.code})`}
                    </PopupList.Button>
                  )
                })}
              </React.Fragment>
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
