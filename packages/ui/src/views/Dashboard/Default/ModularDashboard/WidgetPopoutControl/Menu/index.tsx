'use client'

/* oxlint-disable jsx-a11y/role-has-required-aria-props -- PopupList forwards ariaChecked to aria-checked. */

import { Button } from '../../../../../../elements/Button/index.js'
import { Popup } from '../../../../../../elements/Popup/index.js'
import * as PopupList from '../../../../../../elements/Popup/PopupButtonList/index.js'
import { ChevronIcon } from '../../../../../../icons/Chevron/index.js'

export function WidgetPopoutMenu({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (args: { value: string }) => void
  options: { label: string; value: string }[]
  value: unknown
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <Popup
      disabled={!options.length}
      popupAriaLabel={label}
      popupType="menu"
      portalClassName="widget-popout-menu"
      render={({ close }) => (
        <PopupList.RadioGroup>
          {options.map((option) => (
            <PopupList.RadioGroupItem
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
            </PopupList.RadioGroupItem>
          ))}
        </PopupList.RadioGroup>
      )}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={`${label}: ${selected?.label ?? ''}`}
          buttonStyle="ghost"
          className="widget-popout__menu-button"
          disabled={!options.length}
          extraButtonProps={{ onKeyDown, ...ariaProps }}
          icon={<ChevronIcon direction="right" size={24} />}
          margin={false}
          onClick={onClick}
          selected={active}
        >
          <span className="widget-popout__label">{label}</span>
          <span className="widget-popout__menu-value">{selected?.label ?? ''}</span>
        </Button>
      )}
      side="right"
      size="small"
    />
  )
}
