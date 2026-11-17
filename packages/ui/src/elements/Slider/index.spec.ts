// @vitest-environment jsdom
import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { Slider } from './index.js'
import { normalizeSliderValue, snapSliderToHint, stopSliderAtHint } from './utils.js'

afterEach(() => vi.unstubAllGlobals())

it.each([
  { min: 0, max: 15, step: 5, value: 8, expected: 10 },
  { min: 0.1, max: 1.1, step: 0.1, value: 0.3, expected: 0.3 },
  { min: -1, max: 1, step: 0.25, value: -0.68, expected: -0.75 },
  { min: 1, max: 7, step: 2, value: 4, expected: 5 },
  { min: 0, max: 15, step: 5, value: 100, expected: 15 },
  { min: 0, max: 12, step: 5, value: 12, expected: 10 },
])(
  'should snap $value to $expected for bounds $min–$max with step $step',
  ({ expected, ...args }) => {
    expect(normalizeSliderValue(args)).toBe(expected)
  },
)

it('should attract a pointer near aligned hints and stop large steps at crossed hints', () => {
  const args = { min: 0, max: 100, step: 1, hints: [0, 33, 66, 100] }

  expect(snapSliderToHint({ ...args, value: 32 })).toBe(33)
  expect(snapSliderToHint({ ...args, value: 29 })).toBe(29)
  expect(snapSliderToHint({ ...args, hints: [32.5], value: 32 })).toBe(32)
  expect(stopSliderAtHint({ from: 20, to: 60, hints: args.hints })).toBe(33)
  expect(stopSliderAtHint({ from: 80, to: 40, hints: args.hints })).toBe(66)
})

it('should support shared steps, page keys, bounds and resetting to the default', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const rootElement = document.createElement('div')
  rootElement.dir = 'rtl'
  const root = createRoot(rootElement)
  const changes = vi.fn()
  const Harness = () => {
    const [value, setValue] = useState(0.2)

    return React.createElement(Slider, {
      'aria-label': 'Opacity',
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.2,
      value,
      rangeAnchor: 0,
      onChange: ({ value }) => {
        changes(value)
        setValue(value)
      },
    })
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    const input = rootElement.querySelector<HTMLInputElement>('input[type="range"]')!
    const key = (key: string, shiftKey = false) =>
      act(() =>
        input.dispatchEvent(
          new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, shiftKey }),
        ),
      )

    expect(input.getAttribute('aria-label')).toBe('Opacity')
    expect(input.step).toBe('0.1')
    key('ArrowRight')
    expect(input.value).toBe('0.3')
    key('ArrowDown')
    expect(input.value).toBe('0.2')
    key('PageUp')
    expect(input.value).toBe('1')
    key('PageDown')
    expect(input.value).toBe('0')
    key('End')
    expect(input.value).toBe('1')
    key('Home')
    expect(input.value).toBe('0')
    key('ArrowUp', true)
    expect(input.value).toBe('1')
    key('Delete')
    expect(input.value).toBe('0.2')
    expect(rootElement.querySelector('.slider')!.hasAttribute('data-modified')).toBe(false)
    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' })

    act(() => input.dispatchEvent(escape))
    expect(escape.defaultPrevented).toBe(false)
  } finally {
    act(() => root.unmount())
  }
})

it('should show stopping-point markers and keep a stepped track unfilled', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const rootElement = document.createElement('div')
  const root = createRoot(rootElement)

  try {
    act(() =>
      root.render(
        React.createElement(Slider, {
          'aria-label': 'Weight',
          min: 0,
          max: 15,
          step: 5,
          hints: [0, 5, 10, 15, 20, 5],
          defaultValue: 5,
          value: 10,
          onChange: vi.fn(),
        }),
      ),
    )
    expect(rootElement.querySelectorAll('.slider__hint')).toHaveLength(4)
    expect(rootElement.querySelector('.slider__range')).toBeNull()
    expect(rootElement.querySelector('.slider')!.hasAttribute('data-modified')).toBe(true)
    expect(rootElement.querySelectorAll('.slider__hint--default')).toHaveLength(1)
  } finally {
    act(() => root.unmount())
  }
})

it('should keep a disabled slider out of keyboard editing', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const rootElement = document.createElement('div')
  const root = createRoot(rootElement)
  const onChange = vi.fn()

  try {
    act(() =>
      root.render(
        React.createElement(Slider, {
          'aria-label': 'Limit',
          disabled: true,
          min: 0,
          max: 15,
          step: 5,
          value: 5,
          onChange,
        }),
      ),
    )
    const input = rootElement.querySelector<HTMLInputElement>('input')!

    expect(input.disabled).toBe(true)
    act(() =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }),
      ),
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('5')
  } finally {
    act(() => root.unmount())
  }
})
