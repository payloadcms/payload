'use client'

/* oxlint-disable jsx-a11y/role-has-required-aria-props -- PopupList.Button forwards ariaChecked as aria-checked. */

import type { ClientWidgetControl } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { toWords } from 'payload/shared'

import { Button } from '../../../../../elements/Button/index.js'
import { Popup } from '../../../../../elements/Popup/index.js'
import * as PopupList from '../../../../../elements/Popup/PopupButtonList/index.js'
import { ChevronIcon } from '../../../../../icons/Chevron/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'

export function WidgetSelectControl({
  control,
  onChange,
  value,
  widgetLabel,
}: {
  control: ClientWidgetControl
  onChange: (args: { value: string }) => void
  value: unknown
  widgetLabel: string
}) {
  const { i18n } = useTranslation()
  const label = getTranslation(control.label ?? toWords(control.name), i18n)
  const options = control.options.map((option) =>
    typeof option === 'string'
      ? { label: option, value: option }
      : { label: getTranslation(option.label, i18n), value: option.value },
  )
  const selectedOption = options.find((option) => option.value === value)
  const accessibleLabel = `${widgetLabel}: ${label}`

  return (
    <Popup
      disabled={options.length === 0}
      popupAriaLabel={accessibleLabel}
      popupType="menu"
      render={({ close }) => (
        <PopupList.ButtonGroup>
          {options.map((option) => (
            <PopupList.Button
              active={option.value === value}
              ariaChecked={option.value === value}
              key={option.value}
              onClick={() => {
                onChange({ value: option.value })
                close()
              }}
              role="menuitemradio"
            >
              {option.label}
            </PopupList.Button>
          ))}
        </PopupList.ButtonGroup>
      )}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={`${accessibleLabel}: ${selectedOption?.label ?? label}`}
          buttonStyle="ghost"
          className="widget-wrapper__select-btn"
          disabled={options.length === 0}
          extraButtonProps={{ onKeyDown, ...ariaProps }}
          icon={<ChevronIcon size={16} />}
          margin={false}
          onClick={onClick}
          selected={active}
        >
          <span className="widget-wrapper__select-btn-label">
            {control.Icon ? <span aria-hidden="true">{control.Icon}</span> : null}
            {selectedOption?.label ?? label}
          </span>
        </Button>
      )}
      size="small"
      verticalAlign="bottom"
    />
  )
}
