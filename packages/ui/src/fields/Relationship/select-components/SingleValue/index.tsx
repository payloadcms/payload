'use client'
import type { SingleValueProps } from 'react-select'

import React, { Fragment } from 'react'
import { components as SelectComponents } from 'react-select'

import type { ReactSelectAdapterProps } from '../../../../elements/ReactSelect/types.js'
import type { Option } from '../../types.js'

import { EditIcon } from '../../../../icons/Edit/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'relationship--single-value'

export const SingleValue: React.FC<
  {
    selectProps: {
      // TODO Fix this - moduleResolution 16 breaks our declare module
      customProps: ReactSelectAdapterProps['customProps']
    }
  } & SingleValueProps<Option>
> = (props) => {
  const {
    children,
    data: { allowEdit, label, relationTo, value },
    selectProps: { customProps: { onDocumentOpen } = {} } = {},
  } = props

  const { t } = useTranslation()
  const { permissions } = useAuth()
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read)

  return (
    <SelectComponents.SingleValue {...props} className={baseClass}>
      <div className={`${baseClass}__label`} title={label || ''}>
        <div className={`${baseClass}__label-text`}>
          <div className={`${baseClass}__text`}>{children}</div>
          {relationTo && hasReadPermission && allowEdit !== false && (
            <Fragment>
              <button
                aria-label={t('general:editLabel', { label })}
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
                <EditIcon />
              </button>
            </Fragment>
          )}
        </div>
      </div>
    </SelectComponents.SingleValue>
  )
}
