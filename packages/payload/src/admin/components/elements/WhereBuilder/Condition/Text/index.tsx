import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import ReactSelect from '../../../ReactSelect'
import './index.scss'

const baseClass = 'condition-value-text'

const Text: React.FC<Props> = ({ disabled, onChange, operator, value }) => {
  const { t } = useTranslation()

  const isMulti = ['in', 'not_in'].includes(operator)

  const [valueToRender, setValueToRender] = React.useState<
    { id: string; label: string; value: { value: string } }[]
  >([])

  const onSelect = React.useCallback(
    (selectedOption) => {
      let newValue
      if (!selectedOption) {
        newValue = []
      } else if (isMulti) {
        if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => option.value?.value || option.value)
        } else {
          newValue = [selectedOption.value?.value || selectedOption.value]
        }
      }

      onChange(newValue)
    },
    [isMulti, onChange],
  )

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              toString: () => `${val}${index}`,
              value: (val as any)?.value || val,
            },
          }
        }),
      )
    } else {
      setValueToRender([])
    }
  }, [value])

  return isMulti ? (
    <ReactSelect
      disabled={disabled}
      isClearable
      isCreatable
      isMulti={isMulti}
      isSortable
      onChange={onSelect}
      options={[]}
      placeholder={t('general:enterAValue')}
      value={valueToRender || []}
    />
  ) : (
    <input
      className={baseClass}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('general:enterAValue')}
      type="text"
      value={value || ''}
    />
  )
}

export default Text
