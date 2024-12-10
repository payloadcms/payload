'use client'
import type { ElementType } from 'react'

import { Tooltip } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'
import { useSlate } from 'slate-react'

import type { ButtonProps } from './types.js'

import '../buttons.scss'
import { useElementButton } from '../providers/ElementButtonProvider.js'
import { isElementActive } from './isActive.js'
import { toggleElement } from './toggle.js'

export const baseClass = 'rich-text__button'

export const ElementButton: React.FC<ButtonProps> = (props) => {
  const {
    type = 'type',
    children,
    className,
    disabled: disabledFromProps,
    el = 'button',
    format,
    onClick,
    tooltip,
  } = props

  const editor = useSlate()
  const { disabled: disabledFromContext } = useElementButton()
  const [showTooltip, setShowTooltip] = useState(false)

  const defaultOnClick = useCallback(
    (event) => {
      event.preventDefault()
      setShowTooltip(false)
      toggleElement(editor, format, type)
    },
    [editor, format, type],
  )

  const Tag: ElementType = el

  const disabled = disabledFromProps || disabledFromContext

  return (
    <Tag
      {...(el === 'button' && { type: 'button', disabled })}
      className={[
        baseClass,
        className,
        isElementActive(editor, format, type) && `${baseClass}__button--active`,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick || defaultOnClick}
      onPointerEnter={() => setShowTooltip(true)}
      onPointerLeave={() => setShowTooltip(false)}
    >
      {tooltip && <Tooltip show={showTooltip}>{tooltip}</Tooltip>}
      {children}
    </Tag>
  )
}
