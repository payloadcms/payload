import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation'
import React from 'react'

import { useConfig } from '../../providers/Config'
import { useLocale } from '../../providers/Locale'
import { useSearchParams } from '../../providers/SearchParams'
import { useTranslation } from '../../providers/Translation'
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
  const { dispatchSearchParams, searchParams } = useSearchParams()
  const router = useRouter()
  if (localization) {
    const { locales } = localization

    return (
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Popup
          button={<LocalizerLabel />}
          horizontalAlign="right"
          render={({ close }) => (
            <PopupList.ButtonGroup>
              {locales.map((localeOption) => {
                const newParams = {
                  ...searchParams,
                  locale: localeOption.code,
                }
                const localeOptionLabel = getTranslation(localeOption.label, i18n)

                return (
                  <PopupList.Button
                    active={locale.code === localeOption.code}
                    href={{ query: newParams }}
                    key={localeOption.code}
                    onClick={() => {
                      close()
                      dispatchSearchParams({
                        type: 'set',
                        params: {
                          locale: searchParams.locale,
                        },
                      })
                      router.refresh()
                    }}
                  >
                    {localeOptionLabel}
                    {localeOptionLabel !== localeOption.code && ` (${localeOption.code})`}
                  </PopupList.Button>
                )
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
