'use client'

import React from 'react'

import type { SelectablePill } from '../../../elements/PillSelector/index.js'

import { Button } from '../../../elements/Button/index.js'
import { Popup, PopupList } from '../../../elements/Popup/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

const baseClass = 'select-version-locales'

export type SelectedLocaleOnChange = (args: { locales: SelectablePill[] }) => void
export type Props = {
  locales: SelectablePill[]
  onChange: SelectedLocaleOnChange
}

export const SelectLocales: React.FC<Props> = ({ locales, onChange }) => {
  const { t } = useTranslation()

  return (
    <Popup
      className={baseClass}
      horizontalAlign="right"
      render={() => (
        <PopupList.RadioGroup>
          {locales.map((locale) => (
            <PopupList.RadioGroupItem
              active={locale.selected}
              key={locale.name}
              onClick={() => {
                const newLocales = locales.map((l) =>
                  l.name === locale.name ? { ...l, selected: !l.selected } : l,
                )
                onChange({ locales: newLocales })
              }}
            >
              {locale.name}
            </PopupList.RadioGroupItem>
          ))}
        </PopupList.RadioGroup>
      )}
      renderButton={({ active, ...buttonProps }) => (
        <Button
          {...buttonProps}
          buttonStyle="secondary"
          className={`view-version__toggle-locales`}
          icon={<ChevronIcon direction={active ? 'up' : 'down'} size={16} />}
          selected={locales.some((locale) => locale.selected)}
          size="medium"
        >
          {t('general:locales')}
        </Button>
      )}
      size="small"
      theme="dark"
    />
  )
}
