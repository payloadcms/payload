import qs from 'qs'
import React from 'react'

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

  const locale = useLocale()
  const searchParams = useSearchParams()

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
                    {locale.label}
                    {locale.label !== locale.code && ` (${locale.code})`}
                  </PopupList.Button>
                ) : null}

                {locales.map((localeOption) => {
                  const newParams = {
                    ...searchParams,
                    locale: localeOption.code,
                  }
                  const search = qs.stringify(newParams)

                  if (locale.code === localeOption.code) return null

                  return (
                    <PopupList.Button key={localeOption.code} onClick={close} to={{ search }}>
                      {localeOption.label}
                      {localeOption.label !== localeOption.code && ` (${localeOption.code})`}
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
