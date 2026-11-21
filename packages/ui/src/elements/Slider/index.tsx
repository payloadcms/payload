'use client'

import type { CSSProperties } from 'react'

import { normalizeSliderValue, snapSliderToHint, stopSliderAtHint } from './utils.js'
import './index.css'

export type SliderProps = {
  'aria-label': string
  defaultValue?: number
  disabled?: boolean
  /** Optional stopping-point markers, matching FPL's stepped slider. */
  hints?: number[]
  max: number
  min: number
  onChange: (args: { value: number }) => void
  /** Fill the range between this value and the current value. Omit for a stepped track. */
  rangeAnchor?: number
  step?: number
  value: number
}

export function Slider({
  'aria-label': ariaLabel,
  defaultValue,
  disabled = false,
  hints = [],
  max,
  min,
  onChange,
  rangeAnchor,
  step = 1,
  value,
}: SliderProps) {
  const isDisabled =
    disabled ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max <= min ||
    !Number.isFinite(step) ||
    step <= 0
  const currentValue = normalizeSliderValue({ max, min, step, value })
  const position = !isDisabled && max > min ? (currentValue - min) / (max - min) : 0
  const anchor =
    rangeAnchor === undefined || isDisabled || !Number.isFinite(rangeAnchor)
      ? undefined
      : Math.min(1, Math.max(0, (rangeAnchor - min) / (max - min)))
  const visibleHints = isDisabled
    ? []
    : [...new Set(hints)].filter(
        (hint) =>
          Number.isFinite(hint) &&
          hint >= min &&
          hint <= max &&
          Math.abs(normalizeSliderValue({ max, min, step, value: hint }) - hint) <= step * 1e-9,
      )
  const change = ({ value }: { value: number }) => {
    if (isDisabled) {
      return
    }
    const nextValue = normalizeSliderValue({ max, min, step, value })

    if (nextValue !== currentValue) {
      onChange({ value: nextValue })
    }
  }

  return (
    <div
      className="slider"
      data-disabled={isDisabled || undefined}
      data-modified={currentValue !== defaultValue || undefined}
    >
      <input
        aria-label={ariaLabel}
        className="slider__input"
        disabled={isDisabled}
        max={Number.isFinite(min) && Number.isFinite(max) ? Math.max(min, max) : currentValue}
        min={Number.isFinite(min) ? min : 0}
        onChange={(event) =>
          change({
            value: snapSliderToHint({
              hints: visibleHints,
              max,
              min,
              step,
              value: event.currentTarget.valueAsNumber,
            }),
          })
        }
        onKeyDown={(event) => {
          const increment =
            event.shiftKey || event.key === 'PageUp' || event.key === 'PageDown' ? step * 10 : step
          let nextValue: number

          switch (event.key) {
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'PageDown':
              nextValue = currentValue - increment
              break
            case 'ArrowRight':
            case 'ArrowUp':
            case 'PageUp':
              nextValue = currentValue + increment
              break
            case 'Backspace':
            case 'Delete':
              if (defaultValue === undefined) {
                return
              }
              nextValue = defaultValue
              break
            case 'End':
            case 'F4':
              nextValue = max
              break
            case 'Home':
              nextValue = min
              break
            default:
              return
          }
          event.preventDefault()
          change({
            value:
              event.shiftKey || event.key === 'PageUp' || event.key === 'PageDown'
                ? stopSliderAtHint({ from: currentValue, hints: visibleHints, to: nextValue })
                : nextValue,
          })
        }}
        step={Number.isFinite(step) && step > 0 ? step : 1}
        type="range"
        value={currentValue}
      />
      <span aria-hidden className="slider__visual">
        <span className="slider__track" />
        {anchor !== undefined && (
          <span
            className="slider__range"
            style={{
              insetInlineEnd: `${(1 - Math.max(position, anchor)) * 100}%`,
              insetInlineStart: `${Math.min(position, anchor) * 100}%`,
            }}
          />
        )}
        {visibleHints.map((hint) => (
          <span
            className={`slider__hint${hint === defaultValue ? ' slider__hint--default' : ''}`}
            key={hint}
            style={{ insetInlineStart: `${((hint - min) / (max - min)) * 100}%` }}
          />
        ))}
        <span
          className="slider__thumb"
          style={{ '--slider-position': `${position * 100}%` } as CSSProperties}
        >
          <span className="slider__thumb-shadow" />
          <span className="slider__thumb-knob" />
        </span>
      </span>
    </div>
  )
}
