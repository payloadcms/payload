'use client'

import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import React, { useId, useLayoutEffect, useRef, useState } from 'react'

import { InfoIcon } from '../../../icons/Info/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import './index.css'

export const RequiredFieldsInfo = () => {
  const { t } = useTranslation()
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const explanation = t('general:requiredFields')

  useLayoutEffect(() => {
    const button = buttonRef.current
    const popover = popoverRef.current

    if (!isOpen || !button || !popover) {
      return
    }

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        popover.hidePopover()
      }
    }

    // Dismiss this help before Escape reaches a containing drawer.
    document.addEventListener('keydown', dismissOnEscape, true)

    const cleanup = autoUpdate(button, popover, () => {
      void computePosition(button, popover, {
        middleware: [offset(6), flip(), shift({ padding: 8 })],
        placement: 'bottom-end',
        strategy: 'fixed',
      }).then(({ x, y }) => {
        Object.assign(popover.style, { left: `${x}px`, top: `${y}px` })
      })
    })

    return () => {
      cleanup()
      document.removeEventListener('keydown', dismissOnEscape, true)
    }
  }, [isOpen])

  const open = () => popoverRef.current?.showPopover()

  return (
    <div className="required-fields-info">
      <Button
        aria-controls={id}
        aria-expanded={isOpen}
        aria-label={explanation}
        buttonStyle="ghost"
        extraButtonProps={{
          onBlur: () => popoverRef.current?.hidePopover(),
          onFocus: open,
          onPointerEnter: open,
          title: undefined,
        }}
        icon={
          <span aria-hidden="true">
            <InfoIcon />
          </span>
        }
        margin={false}
        onClick={open}
        ref={buttonRef}
        type="button"
      />
      <div
        className="required-fields-info__content"
        id={id}
        onToggle={(event) => setIsOpen(event.newState === 'open')}
        popover="auto"
        ref={popoverRef}
      >
        {explanation}
      </div>
    </div>
  )
}
