import type { PopupProps } from '../Popup/index.js'

import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { Popup } from '../Popup/index.js'
import './index.scss'

const baseClass = 'checkbox-popup'

type CheckboxPopupProps = {
  Button: React.ReactNode
  onChange: (args: { close: () => void; selectedValues: string[] }) => void
  options: {
    label: string
    value: string
  }[]
  selectedValues: string[]
} & Omit<PopupProps, 'button' | 'render'>
export function CheckboxPopup({
  Button,
  className,
  onChange,
  options,
  selectedValues,
  ...popupProps
}: CheckboxPopupProps) {
  return (
    <Popup
      button={Button}
      className={[baseClass, className].filter(Boolean).join(' ')}
      horizontalAlign="right"
      render={({ close }) => (
        <div className={`${baseClass}__options`}>
          {options.map(({ label, value }) => (
            <CheckboxInput
              checked={selectedValues?.includes(value)}
              key={value}
              label={label}
              onToggle={() => {
                const newSelectedValues = selectedValues?.includes(value)
                  ? selectedValues.filter((v) => v !== value)
                  : [...selectedValues, value]
                onChange({ close, selectedValues: newSelectedValues })
              }}
            />
          ))}
        </div>
      )}
      showScrollbar
      verticalAlign="bottom"
      {...popupProps}
    />
  )
}
