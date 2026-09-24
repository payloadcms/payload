'use client'
import type { OptionLabel } from 'payload'
import type { MultiValueGenericProps, MultiValueProps } from 'react-select'

import { getTranslation } from '@payloadcms/translations'
import React, { use } from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { MultiValueDragActivatorContext } from '../MultiValue/context.js'
import { generateMultiValueDraggableID } from '../MultiValue/index.js'
import './index.css'

const baseClass = 'multi-value-label'

export const getMultiValueLabelID = ({
  data,
  selectProps,
}: {
  data: Option
  selectProps: MultiValueGenericProps<Option>['selectProps']
}) => {
  const optionID = generateMultiValueDraggableID(data, selectProps.getOptionValue)

  return `${String(selectProps.instanceId)}-multi-value-${encodeURIComponent(String(optionID))}-label`
}

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    data,
    // @ts-expect-error-next-line// TODO Fix this - moduleResolution 16 breaks our declare module
    selectProps: { customProps: { draggableProps, editableProps } = {}, isDisabled } = {},
  } = props
  const { i18n } = useTranslation()

  const className = `${baseClass}__text`
  const labelText = data.label ? getTranslation(data.label as OptionLabel, i18n) : ''
  const titleText = typeof labelText === 'string' ? labelText : ''
  const labelID = getMultiValueLabelID({ data, selectProps: props.selectProps })
  const dragActivator = use(MultiValueDragActivatorContext)
  const { ref: dragActivatorRef, ...dragActivatorProps } = dragActivator || {}
  const editableInnerProps =
    (editableProps && editableProps(data, className, props.selectProps)) || {}

  return (
    <div
      className={[baseClass, isDisabled ? `${baseClass}--disabled` : ''].filter(Boolean).join(' ')}
      title={titleText}
    >
      {dragActivator && !editableProps ? (
        <button
          {...dragActivatorProps}
          className={`${baseClass}__drag-button`}
          ref={dragActivatorRef}
          type="button"
        >
          <span className={className} id={labelID}>
            {props.children}
          </span>
        </button>
      ) : (
        <SelectComponents.MultiValueLabel
          {...props}
          innerProps={{
            id: labelID,
            className,
            ...editableInnerProps,
            ...(draggableProps || {}),
            ...(dragActivatorProps || {}),
            ref: dragActivatorRef,
          }}
        />
      )}
    </div>
  )
}
