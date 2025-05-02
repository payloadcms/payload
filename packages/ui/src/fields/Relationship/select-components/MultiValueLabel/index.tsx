'use client'
import type { MultiValueProps } from 'react-select'

import React, { Fragment, useState } from 'react'
import { components } from 'react-select'

import type { ReactSelectAdapterProps } from '../../../../elements/ReactSelect/types.js'
import type { Option } from '../../types.js'

import { Tooltip } from '../../../../elements/Tooltip/index.js'
import { EditIcon } from '../../../../icons/Edit/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.scss'

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
    selectProps: { customProps: { draggableProps, onDocumentDrawerOpen } = {} } = {},
  } = props

  const { permissions } = useAuth()
  const [showTooltip, setShowTooltip] = useState(false)
  const { t } = useTranslation()
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read)

  return (
    <div className={baseClass}>
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
            onClick={() => {
              setShowTooltip(false)
              onDocumentDrawerOpen({
                id: value,
                collectionSlug: relationTo,
                hasReadPermission,
              })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
              }
            }}
            onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onTouchEnd={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
            type="button"
          >
            <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
              {t('general:editLabel', { label: '' })}
            </Tooltip>
            <EditIcon className={`${baseClass}__icon`} />
          </button>
        </Fragment>
      )}
    </div>
  )
}
