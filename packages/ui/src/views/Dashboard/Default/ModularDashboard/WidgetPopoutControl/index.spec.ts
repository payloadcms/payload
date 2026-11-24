// @vitest-environment jsdom
import type { ClientWidgetPopoutControl } from 'payload'

import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { WidgetPopoutControl } from './index.js'

vi.mock('../../../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en', direction: 'ltr' }, t: (key: string) => key }),
}))
vi.mock('../../../../../providers/Theme/index.js', () => ({
  useTheme: () => ({ theme: 'dark' }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const control: ClientWidgetPopoutControl = {
  type: 'popout',
  label: 'Options',
  controls: [
    {
      type: 'group',
      label: 'General',
      controls: [
        { type: 'switch', name: 'visible', label: 'Show trend' },
        { type: 'text', name: 'caption', label: 'Caption' },
        {
          type: 'number',
          name: 'limit',
          label: 'Limit',
          min: 0,
          max: 15,
          step: 5,
          defaultValue: 0,
          slider: { hints: [0, 5, 10, 15] },
        },
      ],
    },
    {
      type: 'group',
      controls: [
        { type: 'segment', name: 'align', label: 'Alignment', options: ['left', 'right'] },
        { type: 'select', name: 'period', label: 'Period', options: ['week', 'month'] },
        { type: 'menu', name: 'display', label: 'Display', options: ['list', 'grid'] },
      ],
    },
  ],
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const matches = HTMLElement.prototype.matches

  vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (selector) {
    return selector === ':popover-open'
      ? this.hasAttribute('data-test-open')
      : matches.call(this, selector)
  })
  Object.defineProperty(HTMLElement.prototype, 'showPopover', {
    configurable: true,
    value() {
      this.setAttribute('data-test-open', '')
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
    configurable: true,
    value() {
      this.removeAttribute('data-test-open')
    },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete HTMLElement.prototype.showPopover
  delete HTMLElement.prototype.hidePopover
  document.body.innerHTML = ''
})

it('should keep the popout open for live edits and preserve them when Escape closes it', async () => {
  const container = document.createElement('div')

  document.body.appendChild(container)
  const root = createRoot(container)
  let data: Record<string, unknown> = {
    visible: true,
    caption: 'Original',
    limit: 0,
    align: 'left',
    period: 'week',
    display: 'list',
  }
  const Harness = () => {
    const [values, setValues] = useState(data)

    data = values
    return React.createElement(WidgetPopoutControl, {
      control,
      data: values,
      widgetLabel: 'Count',
      onChange: ({ name, value }) => setValues((previous) => ({ ...previous, [name]: value })),
    })
  }

  try {
    await act(async () => root.render(React.createElement(Harness)))
    const trigger = container.querySelector<HTMLButtonElement>('button')!

    await act(async () => trigger.click())
    const dialog = document.querySelector<HTMLElement>('.popup__content[role="dialog"]')!

    expect(dialog.getAttribute('aria-label')).toBe('Count: Options')
    const toggle = dialog.querySelector<HTMLInputElement>('[aria-label="Show trend"]')!

    await act(async () => toggle.click())
    expect(data.visible).toBe(false)
    expect(document.querySelector('.popup__content[role="dialog"]')).not.toBeNull()
    const increment = dialog.querySelector<HTMLButtonElement>('[aria-label="general:increment"]')!

    await act(async () => increment.click())
    expect(data.limit).toBe(5)
    const slider = dialog.querySelector<HTMLInputElement>(
      'input[type="range"][aria-label="Limit"]',
    )!

    expect(slider.value).toBe('5')
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(slider, '10')
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(data.limit).toBe(10)
    expect(dialog.querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe('10')
    for (let index = 0; index < 4; index++) {
      await act(async () => increment.click())
    }
    expect(data.limit).toBe(15)
    const number = dialog.querySelector<HTMLInputElement>('input[type="number"]')!
    const numberArrow = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowUp',
    })

    await act(async () => number.dispatchEvent(numberArrow))
    expect(numberArrow.defaultPrevented).toBe(false)
    const segment = dialog.querySelector<HTMLInputElement>('input[type="radio"][value="right"]')!

    await act(async () => segment.click())
    expect(data.align).toBe('right')
    const select = dialog.querySelector<HTMLInputElement>(
      'input[role="combobox"][aria-label="Period"]',
    )!

    await act(async () =>
      select.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }),
      ),
    )
    const option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (option) => option.textContent === 'month',
    )!

    expect(option).toBeDefined()
    await act(async () => {
      option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      option.click()
    })
    expect(data.period).toBe('month')
    expect(document.querySelector('.popup__content[role="dialog"]')).not.toBeNull()
    const text = dialog.querySelector<HTMLInputElement>('input[type="text"][aria-label="Caption"]')!

    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        text,
        'Edited',
      )
      text.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(data.caption).toBe('Edited')
    await act(async () =>
      text.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })),
    )
    expect(document.querySelector('.popup__content[role="dialog"]')).toBeNull()
    expect(data).toMatchObject({ visible: false, limit: 15, align: 'right', caption: 'Edited' })
    await act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
    expect(document.activeElement).toBe(trigger)
  } finally {
    await act(async () => root.unmount())
  }
})

it('should close a nested menu after selection while retaining the form popout', async () => {
  const container = document.createElement('div')

  document.body.appendChild(container)
  const root = createRoot(container)
  const onChange = vi.fn()

  try {
    await act(async () =>
      root.render(
        React.createElement(WidgetPopoutControl, {
          control,
          data: { display: 'list' },
          onChange,
          widgetLabel: 'Count',
        }),
      ),
    )
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click())
    const dialog = document.querySelector<HTMLElement>('.popup__content[role="dialog"]')!

    await act(async () =>
      dialog.querySelector<HTMLButtonElement>('[aria-label="Display: list"]')!.click(),
    )
    const menu = document.querySelector<HTMLElement>('.popup__content[role="menu"]')!

    await act(async () =>
      menu.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })),
    )
    expect(document.querySelector('.popup__content[role="menu"]')).toBeNull()
    expect(document.querySelector('.popup__content[role="dialog"]')).not.toBeNull()
    await act(async () =>
      dialog.querySelector<HTMLButtonElement>('[aria-label="Display: list"]')!.click(),
    )
    const options = document.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')

    await act(async () => options[1].click())
    expect(onChange).toHaveBeenCalledWith({ name: 'display', value: 'grid' })
    expect(document.querySelector('.popup__content[role="menu"]')).toBeNull()
    expect(document.querySelector('.popup__content[role="dialog"]')).not.toBeNull()
  } finally {
    await act(async () => root.unmount())
  }
})
