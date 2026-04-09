'use client'
import type { MultiValueProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

import { useDraggableSortable } from '../../DraggableSortable/useDraggableSortable/index.js'
import './index.scss'

const baseClass = 'multi-value'

export function generateMultiValueDraggableID(optionData, valueFunction) {
  return typeof valueFunction === 'function' ? valueFunction(optionData) : optionData?.value
}
export const MultiValue: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    className,
    data,
    innerProps,
    isDisabled,
    // @ts-expect-error // TODO Fix this - moduleResolution 16 breaks our declare module
    selectProps: { customProps: { disableMouseDown } = {}, getOptionValue, isSortable } = {},
  } = props

  const id = generateMultiValueDraggableID(data, getOptionValue)

  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggableSortable({
    id,
    disabled: !isSortable,
  })

  const classes = [
    baseClass,
    className,
    !isDisabled && isSortable && 'draggable',
    isDragging && `${baseClass}--is-dragging`,
  ]
    .filter(Boolean)
    .join(' ')

  // Extract onMouseDown from listeners to preserve the MouseSensor handler
  const { onMouseDown: listenersMouseDown, ...restListeners } = listeners || {}

  return (
    <React.Fragment>
      <SelectComponents.MultiValue
        {...props}
        className={classes}
        innerProps={{
          ...(isSortable
            ? {
                ...attributes,
                ...restListeners,
              }
            : {}),
          ...innerProps,
          onMouseDown: (e) => {
            // Call the MouseSensor's handler first to enable mouse dragging
            if (isSortable && listenersMouseDown) {
              listenersMouseDown(e)
            }

            if (!disableMouseDown) {
              // we need to prevent the dropdown from opening when clicking on the drag handle, but not when a modal is open (i.e. the 'Relationship' field component)
              e.stopPropagation()
            }
          },
          ref: setNodeRef,
          style: isSortable
            ? {
                transform,
                ...attributes?.style,
              }
            : {},
        }}
      />
    </React.Fragment>
  )
}
