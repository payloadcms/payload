'use client'
import type { HTMLAttributes, RefCallback } from 'react'
import type { MultiValueGenericProps, MultiValueProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'
import type { MultiValueDragActivator } from './context.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { useDraggableSortable } from '../../DraggableSortable/useDraggableSortable/index.js'
import { getOptionAccessibleName } from '../Option/index.js'
import { MultiValueDragActivatorContext } from './context.js'
import './index.css'

const baseClass = 'multi-value'

type SortableContainerInnerProps = {
  dragActivator?: MultiValueDragActivator
  nodeRef?: RefCallback<HTMLElement>
} & HTMLAttributes<HTMLDivElement>

const SortableMultiValueContainer: React.FC<MultiValueGenericProps<Option>> = ({
  children,
  innerProps,
}) => {
  const { dragActivator, nodeRef, ...containerProps } = innerProps as SortableContainerInnerProps

  return (
    <MultiValueDragActivatorContext value={dragActivator}>
      <div {...containerProps} ref={nodeRef}>
        {children}
      </div>
    </MultiValueDragActivatorContext>
  )
}

export function generateMultiValueDraggableID(optionData, valueFunction) {
  return typeof valueFunction === 'function' ? valueFunction(optionData) : optionData?.value
}
export const MultiValue: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    className,
    data,
    index,
    innerProps,
    isDisabled,
    // @ts-expect-error // TODO Fix this - moduleResolution 16 breaks our declare module
    selectProps: { customProps: { disableMouseDown } = {}, getOptionValue, isSortable } = {},
  } = props

  const id = generateMultiValueDraggableID(data, getOptionValue)

  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform } =
    useDraggableSortable({
      id,
      disabled: !isSortable,
    })
  const { t } = useTranslation()

  const classes = [
    baseClass,
    className,
    !isDisabled && isSortable && 'draggable',
    isDragging && `${baseClass}--is-dragging`,
  ]
    .filter(Boolean)
    .join(' ')

  const { onMouseDown: listenersMouseDown, ...restListeners } = listeners || {}
  const { style: sortableStyle, ...sortableAttributes } = attributes
  const optionName = getOptionAccessibleName(data, props.children, String(id)) || String(id)
  const valueCount = Array.isArray(props.selectProps.value) ? props.selectProps.value.length : 1

  const dragActivator: MultiValueDragActivator | undefined =
    isSortable && !isDisabled
      ? {
          ...sortableAttributes,
          ...restListeners,
          'aria-label': `${t('general:dragToReorder')} ${optionName}, ${index + 1} of ${valueCount}`,
          onMouseDown: (event) => {
            listenersMouseDown?.(event)
            event.stopPropagation()
          },
          ref: setActivatorNodeRef,
        }
      : undefined
  const sortableInnerProps: SortableContainerInnerProps = {
    ...innerProps,
    dragActivator,
    nodeRef: setNodeRef,
    onMouseDown: (event) => {
      if (!disableMouseDown) {
        event.stopPropagation()
      }
    },
    style: {
      ...innerProps?.style,
      ...sortableStyle,
      transform,
    },
  }

  return (
    <SelectComponents.MultiValue
      {...props}
      className={classes}
      components={{
        ...props.components,
        Container: SortableMultiValueContainer,
      }}
      innerProps={sortableInnerProps as MultiValueProps<Option>['innerProps']}
    />
  )
}
