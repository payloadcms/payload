'use client'

import type { ClientWidgetLeafControl } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { toWords } from 'payload/shared'
import { useId } from 'react'

import { SegmentedControl } from '../../../../../../elements/SegmentedControl/index.js'
import { Slider } from '../../../../../../elements/Slider/index.js'
import { normalizeSliderValue } from '../../../../../../elements/Slider/utils.js'
import { Switch } from '../../../../../../elements/Switch/index.js'
import { NumberInput } from '../../../../../../fields/Number/Input.js'
import { SelectInput } from '../../../../../../fields/Select/Input.js'
import { TextInput } from '../../../../../../fields/Text/Input.js'
import { useTranslation } from '../../../../../../providers/Translation/index.js'
import { WidgetPopoutMenu } from '../Menu/index.js'

export function WidgetPopoutField({
  control,
  onChange,
  value,
}: {
  control: ClientWidgetLeafControl
  onChange: (args: { name: string; value: boolean | null | number | string }) => void
  value: unknown
}) {
  const { i18n } = useTranslation()
  const id = useId()
  const path = `widget-control-${id}`
  const label = getTranslation(control.label ?? toWords(control.name), i18n)
  const change = (value: boolean | null | number | string) =>
    onChange({ name: control.name, value })
  const options =
    'options' in control
      ? control.options.map((option) =>
          typeof option === 'string'
            ? { Icon: undefined, label: option, value: option }
            : { ...option, label: getTranslation(option.label, i18n) },
        )
      : []
  let input: React.ReactNode

  if (control.type === 'switch') {
    input = <Switch ariaLabel={label} checked={value === true} id={path} onChange={change} />
  } else if (control.type === 'text') {
    input = (
      <TextInput
        Description={null}
        Error={null}
        htmlAttributes={{ 'aria-label': label }}
        id={path}
        Label={null}
        onChange={(event) => change(event.currentTarget.value)}
        path={path}
        placeholder={control.placeholder}
        size="medium"
        value={typeof value === 'string' ? value : ''}
      />
    )
  } else if (control.type === 'number') {
    const clamp = ({ number }: { number: number }) =>
      control.slider
        ? normalizeSliderValue({
            max: control.max,
            min: control.min,
            step: control.step ?? 1,
            value: number,
          })
        : Math.min(control.max ?? Infinity, Math.max(control.min ?? -Infinity, number))

    input = (
      <NumberInput
        ariaLabel={label}
        Description={null}
        Error={null}
        Label={null}
        max={control.max}
        min={control.min}
        onChange={(event) =>
          change(
            Number.isFinite(event.currentTarget.valueAsNumber)
              ? clamp({ number: event.currentTarget.valueAsNumber })
              : null,
          )
        }
        onStep={(direction) => {
          const element = document.getElementById(`field-${path}`) as HTMLInputElement | null
          if (!element) {
            return
          }
          if (direction === 'up') {
            element.stepUp()
          } else {
            element.stepDown()
          }
          if (Number.isFinite(element.valueAsNumber)) {
            change(clamp({ number: element.valueAsNumber }))
          }
        }}
        path={path}
        placeholder={control.placeholder}
        size="medium"
        step={control.step}
        value={typeof value === 'number' ? value : null}
      />
    )
  } else if (control.type === 'segment') {
    input = (
      <SegmentedControl.Root
        legend={label}
        onChange={change}
        value={typeof value === 'string' ? value : ''}
      >
        {options.map((option) => (
          <SegmentedControl.Option
            aria-label={option.label}
            icon={
              option.Icon ?? <span className="widget-popout__segment-label">{option.label}</span>
            }
            key={option.value}
            value={option.value}
          />
        ))}
      </SegmentedControl.Root>
    )
  } else if (control.type === 'menu') {
    return (
      <div className="widget-popout__menu-row">
        <WidgetPopoutMenu
          label={label}
          onChange={({ value }) => change(value)}
          options={options}
          value={value}
        />
      </div>
    )
  } else {
    input = (
      <SelectInput
        Description={null}
        Error={null}
        id={path}
        isClearable={false}
        Label={null}
        label={label}
        name={path}
        onChange={(option) =>
          change(
            option && 'value' in option
              ? typeof option.value === 'string'
                ? option.value
                : ''
              : '',
          )
        }
        options={options}
        path={path}
        size="medium"
        value={typeof value === 'string' ? value : undefined}
      />
    )
  }

  return (
    <div className={`widget-popout__row widget-popout__row--${control.type}`}>
      <span className="widget-popout__label">{label}</span>
      <div className="widget-popout__value">{input}</div>
      {control.type === 'number' && control.slider && (
        <div className="widget-popout__slider">
          <Slider
            aria-label={label}
            defaultValue={control.defaultValue}
            hints={typeof control.slider === 'object' ? control.slider.hints : undefined}
            max={control.max}
            min={control.min}
            onChange={({ value }) => change(value)}
            rangeAnchor={control.min}
            step={control.step}
            value={typeof value === 'number' ? value : (control.defaultValue ?? control.min)}
          />
        </div>
      )}
    </div>
  )
}
