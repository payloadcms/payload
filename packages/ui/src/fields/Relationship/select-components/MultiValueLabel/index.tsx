'use client'
import type { MultiValueProps } from 'react-select'

import React, { Fragment } from 'react'
import { components } from 'react-select'

import type { ReactSelectAdapterProps } from '../../../../elements/ReactSelect/types.js'
import type { Option } from '../../types.js'

import { EditIcon } from '../../../../icons/Edit/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import './index.css'

const baseClass = 'relationship--multi-value-label'

export const MultiValueLabel: React.FC<
  {
    selectProps: {
      // TODO Fix this - moduleResolution 16 breaks our declare module
      customProps: ReactSelectAdapterProps['customProps']
    }
  } & MultiValueProps<Option>
> = (props) => {
  const {
    data: { allowEdit, label, relationTo, value },
    selectProps: { customProps: { draggableProps, onDocumentOpen } = {} } = {},
  } = props

  const { permissions } = useAuth()
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read)

  return (
    <div className={baseClass} title={label || ''}>
      <div className={`${baseClass}__content`}>
        <components.MultiValueLabel
          {...props}
          innerProps={{
            className: `${baseClass}__text`,
            ...(draggableProps || {}),
          }}
        />
      </div>
      {relationTo && hasReadPermission && allowEdit !== false && (
        <Fragment>
          <button
            aria-label={`Edit ${label}`}
            className={`${baseClass}__drawer-toggler`}
            onClick={(event) => {
              onDocumentOpen({
                id: value,
                collectionSlug: relationTo,
                hasReadPermission,
                openInNewTab: event.metaKey || event.ctrlKey,
              })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
              }
            }}
            onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
            onTouchEnd={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
            type="button"
          >
            <EditIcon className={`${baseClass}__icon`} />
          </button>
        </Fragment>
      )}
    </div>
  )
}
