'use client'
import type { StaticLabel } from 'payload'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { Tooltip } from '../../elements/Tooltip/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'

export type CheckboxInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
  readonly BeforeInput?: React.ReactNode
  readonly checked?: boolean
  readonly className?: string
  readonly Error?: React.ReactNode
  readonly id?: string
  readonly inputRef?: React.RefObject<HTMLInputElement | null>
  readonly Label?: React.ReactNode
  readonly label?: StaticLabel
  readonly localized?: boolean
  readonly name?: string
  readonly onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void
  readonly partialChecked?: boolean
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly tooltip?: string
  /**
   * Visual variant for the checkbox
   * - 'default': Brand fill and an on-brand mark when checked (for form fields)
   * - 'muted': Keeps the neutral surface when checked (for tables)
   */
  readonly variant?: 'default' | 'muted'
}

export const inputBaseClass = 'checkbox-input'

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id: idFromProps,
  name,
  AfterInput,
  'aria-label': ariaLabelFromProps,
  'aria-labelledby': ariaLabelledByFromProps,
  BeforeInput,
  checked,
  className,
  Error,
  inputRef,
  Label,
  label,
  localized,
  onToggle,
  partialChecked,
  readOnly: readOnlyFromProps,
  required,
  tooltip,
  variant = 'default',
}) => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)
  const fallbackID = useId()
  const id = idFromProps || fallbackID
  const ariaLabel = ariaLabelFromProps || undefined
  const ariaLabelledBy = ariaLabel ? undefined : ariaLabelledByFromProps || name
  const controlWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const readOnly = readOnlyFromProps || !isHydrated
  const isIndeterminate = !checked && Boolean(partialChecked)

  /**
   * `indeterminate` has no HTML attribute, so the mixed state has to be written to the
   * node itself. The node is reached through the wrapper rather than a ref on the input
   * so that a caller-supplied `inputRef` stays the only ref attached to it. Setting the
   * property keeps mark selection in CSS and reports the real `mixed` state to
   * assistive technology.
   */
  useEffect(() => {
    const control = controlWrapRef.current?.querySelector(`.${inputBaseClass}__control`)

    if (control instanceof HTMLInputElement) {
      control.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  /**
   * The mark only draws itself in once the value has actually changed, so a document
   * that loads with the box already checked doesn't replay the animation.
   */
  const handleToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setHasChanged(true)
      onToggle(event)
    },
    [onToggle],
  )

  return (
    <div
      className={[
        className,
        inputBaseClass,
        checked && `${inputBaseClass}--checked`,
        isIndeterminate && `${inputBaseClass}--indeterminate`,
        readOnly && `${inputBaseClass}--read-only`,
        hasChanged && `${inputBaseClass}--changed`,
        tooltip && `${inputBaseClass}--has-tooltip`,
        variant !== 'default' && `${inputBaseClass}--${variant}`,
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerEnter={tooltip ? () => setShowTooltip(true) : undefined}
      onPointerLeave={tooltip ? () => setShowTooltip(false) : undefined}
    >
      {BeforeInput}
      <div className={`${inputBaseClass}__wrap`}>
        <div className={`${inputBaseClass}__input`} ref={controlWrapRef}>
          <input
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            checked={Boolean(checked)}
            className={[
              `${inputBaseClass}__control`,
              variant !== 'default' && `${inputBaseClass}__control--${variant}`,
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={readOnly}
            id={id}
            name={name}
            onChange={handleToggle}
            ref={inputRef}
            required={required}
            title={name}
            type="checkbox"
          />
          {/* Both marks are always rendered and revealed by CSS, so an uncontrolled
              input that changes without React knowing still shows the right mark. */}
          <span className={`${inputBaseClass}__visuals`}>
            <Mark className={`${inputBaseClass}__mixed`} shape="mixed" />
            <Mark className={`${inputBaseClass}__check`} shape="check" />
          </span>
        </div>
        <RenderCustomComponent
          CustomComponent={Label}
          Fallback={
            <FieldLabel htmlFor={id} label={label} localized={localized} required={required} />
          }
        />
        {Error}
      </div>
      {tooltip && (
        <Tooltip alignCaret="left" className={`${inputBaseClass}__tooltip`} show={showTooltip}>
          {tooltip}
        </Tooltip>
      )}
      {AfterInput}
    </div>
  )
}

const markShapes = {
  check: { d: 'M5.00012 8.5L7.5 11L11.5 5', shapeRendering: 'geometricPrecision' },
  mixed: { d: 'M5 8H11', shapeRendering: 'crispEdges' },
} as const

/**
 * Each mark is drawn twice: a wider halo stroke underneath, then the mark itself on
 * top. The halo is what keeps the mark legible against the brand fill.
 */
const Mark: React.FC<{
  readonly className: string
  readonly shape: keyof typeof markShapes
}> = ({ className, shape }) => {
  const { d, shapeRendering } = markShapes[shape]

  return (
    <svg
      className={className}
      fill="none"
      height={16}
      viewBox="0 0 16 16"
      width={16}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path className={`${inputBaseClass}__mark-halo`} d={d} shapeRendering={shapeRendering} />
      <path className={`${inputBaseClass}__mark`} d={d} shapeRendering={shapeRendering} />
    </svg>
  )
}
