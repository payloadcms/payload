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

it('should resolve nested groups, placeholders and segment icons without mutating config', () => {
  const Icon = () => null
  const nested: WidgetControl[] = [
    {
      type: 'popout',
      label: { en: 'Options', es: 'Opciones' },
      controls: [
        {
          type: 'group',
          label: () => 'General',
          controls: [
            {
              type: 'text',
              name: 'caption',
              label: () => 'Caption',
              placeholder: { en: 'Value', es: 'Valor' },
            },
            {
              type: 'segment',
              name: 'align',
              options: [{ Icon: './Align', label: () => 'Left', value: 'left' }],
            },
          ],
        },
      ],
    },
  ]
  const result = createClientWidgetControls({
    controls: nested,
    importMap: { './Align#default': Icon },
    i18n: { language: 'es' } as I18nClient,
  })
  const popout = result?.[0]

  expect(popout?.label).toBe('Opciones')
  if (popout?.type !== 'popout') throw new Error('Expected popout')
  const group = popout.controls[0]

  expect(group.label).toBe('General')
  if (group.type !== 'group') throw new Error('Expected group')
  expect(group.controls[0]).toMatchObject({ label: 'Caption', placeholder: 'Valor' })
  const segment = group.controls[1]

  if (segment.type !== 'segment') throw new Error('Expected segment')
  expect(segment.options[0]).toMatchObject({ label: 'Left', value: 'left' })
  expect(typeof segment.options[0] !== 'string' && isValidElement(segment.options[0].Icon)).toBe(
    true,
  )
  expect(typeof nested[0].label).toBe('object')
})

it('should apply nested defaults to flat data and preserve explicit false, zero and empty values', () => {
  const controls: WidgetControl[] = [
    {
      type: 'popout',
      label: 'Options',
      controls: [
        {
          type: 'group',
          controls: [
            { type: 'switch', name: 'visible', defaultValue: true },
            { type: 'number', name: 'limit', defaultValue: 10, step: 5 },
            { type: 'text', name: 'caption', defaultValue: 'My caption' },
            { type: 'menu', name: 'display', defaultValue: 'list', options: ['list', 'grid'] },
          ],
        },
      ],
    },
  ]

  expect(getWidgetControlData({ controls })).toEqual({
    visible: true,
    limit: 10,
    caption: 'My caption',
    display: 'list',
  })
  const data = { visible: false, limit: 0, caption: '', display: null, drawerField: 'keep' }

  expect(getWidgetControlData({ controls, data })).toEqual(data)
  expect(data).toEqual({
    visible: false,
    limit: 0,
    caption: '',
    display: null,
    drawerField: 'keep',
  })
})

it('should normalize slider values on load without mutating stored data or clearing empty inputs', () => {
  const controls: WidgetControl[] = [
    {
      type: 'popout',
      label: 'Options',
      controls: [
        {
          type: 'number',
          name: 'limit',
          min: 0,
          max: 15,
          step: 5,
          slider: { hints: [0, 5, 10, 15] },
        },
      ],
    },
  ]
  const data = { limit: 7 }

  expect(getWidgetControlData({ controls, data })).toEqual({ limit: 5 })
  expect(data).toEqual({ limit: 7 })
  expect(getWidgetControlData({ controls, data: { limit: null } })).toEqual({ limit: null })
})
