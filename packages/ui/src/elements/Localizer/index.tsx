'use client'
import { getTranslation } from '@payloadcms/translations'
import { useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { Popup, PopupList } from '../Popup/index.js'
import { LocalizerLabel } from './LocalizerLabel/index.js'
import './index.scss'

const baseClass = 'localizer'

export const Localizer: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  const { config } = useConfig()
  const { localization } = config
  const searchParams = useSearchParams()

  const { i18n } = useTranslation()
  const locale = useLocale()

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
                const localeOptionLabel = getTranslation(localeOption.label, i18n)

                return (
                  <PopupList.Button
                    active={locale.code === localeOption.code}
                    href={qs.stringify(
                      {
                        ...parseSearchParams(searchParams),
                        locale: localeOption.code,
                      },
                      { addQueryPrefix: true },
                    )}
                    key={localeOption.code}
                    onClick={close}
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
