import type { I18nClient } from '@payloadcms/translations'

import { describe, expect, it } from 'vitest'
import { isValidElement } from 'react'

import type { WidgetControl } from './types.js'

import { createClientWidgetControls, getWidgetControlData } from './widgetControls.js'

const controls: WidgetControl[] = [
  {
    name: 'timeframe',
    type: 'select',
    defaultValue: 'monthly',
    label: ({ t }) => t('general:date'),
    options: [{ label: { en: 'Monthly', es: 'Mensual' }, value: 'monthly' }, 'weekly'],
  },
]

describe('widget controls', () => {
  it('should resolve label functions and translated option labels before sending controls to the client', () => {
    const result = createClientWidgetControls({
      controls,
      importMap: {},
      i18n: { language: 'es', t: () => 'Fecha' } as unknown as I18nClient,
    })

    expect(result).toEqual([
      {
        ...controls[0],
        label: 'Fecha',
        options: [{ label: 'Mensual', value: 'monthly' }, 'weekly'],
      },
    ])
    expect(typeof controls[0]!.label).toBe('function')
  })

  it('should apply defaults without overwriting saved settings or mutating widget data', () => {
    const data = { title: 'Sales', timeframe: 'weekly' }

    expect(getWidgetControlData({ controls })).toEqual({ timeframe: 'monthly' })
    expect(getWidgetControlData({ controls, data })).toEqual(data)
    expect(getWidgetControlData({ controls, data })).not.toBe(data)
    expect(getWidgetControlData({ controls, data: { title: 'Sales' } })).toEqual({
      title: 'Sales',
      timeframe: 'monthly',
    })
  })

  it('should leave controls without defaults unset and preserve explicit empty values', () => {
    expect(getWidgetControlData({ controls: [{ name: 'collection' }] })).toEqual({})
    expect(getWidgetControlData({ controls, data: { timeframe: null } })).toEqual({
      timeframe: null,
    })
  })
  it('should resolve an optional icon through the import map and pass its client props', () => {
    const Icon = () => null
    const result = createClientWidgetControls({
      controls: [
        {
          ...controls[0]!,
          Icon: { path: './TableIcon', clientProps: { size: 16 } },
        },
      ],
      importMap: { './TableIcon#default': Icon },
      i18n: { language: 'en', t: () => 'Date' } as unknown as I18nClient,
    })
    const icon = result?.[0]?.Icon

    expect(isValidElement(icon)).toBe(true)
    if (isValidElement<{ size: number }>(icon)) {
      expect(icon.type).toBe(Icon)
      expect(icon.props.size).toBe(16)
    }
  })
})
