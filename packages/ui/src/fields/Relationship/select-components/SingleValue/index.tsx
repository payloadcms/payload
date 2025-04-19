'use client'
import type { SingleValueProps } from 'react-select'

import { formatAdminURL } from 'payload/shared'
import React, { Fragment, useState } from 'react'
import { components as SelectComponents } from 'react-select'

import type { ReactSelectAdapterProps } from '../../../../elements/ReactSelect/types.js'
import type { Option } from '../../types.js'

import { Link } from '../../../../elements/Link/index.js'
import { Tooltip } from '../../../../elements/Tooltip/index.js'
import { EditIcon } from '../../../../icons/Edit/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.scss'

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
    selectProps: { customProps: { adminRoute, onDocumentOpen } = {} } = {},
  } = props

  const [showTooltip, setShowTooltip] = useState(false)
  const { t } = useTranslation()
  const { permissions } = useAuth()
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read)
  const docUrl = formatAdminURL({
    adminRoute,
    path: `/collections/${relationTo}/${value}`,
  })

  return (
    <SelectComponents.SingleValue {...props} className={baseClass}>
      <div className={`${baseClass}__label`}>
        <div className={`${baseClass}__label-text`}>
          <div className={`${baseClass}__text`}>{children}</div>
          {relationTo && hasReadPermission && allowEdit !== false && (
            <Fragment>
              <Link
                aria-label={t('general:editLabel', { label })}
                className={`${baseClass}__drawer-toggler`}
                href={docUrl}
                onClick={(event) => {
                  setShowTooltip(false)
                  onDocumentOpen({
                    id: value,
                    collectionSlug: relationTo,
                    hasReadPermission,
                    inNewTab: event.metaKey || event.ctrlKey,
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
                onTouchEnd={(e) => e.stopPropagation()} // prevents react-select dropdown from openingtype="button"
                skipRouteTransition
              >
                <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
                  {t('general:edit')}
                </Tooltip>
                <EditIcon />
              </Link>
            </Fragment>
          )}
        </div>
      </div>
    </SelectComponents.SingleValue>
  )
}
