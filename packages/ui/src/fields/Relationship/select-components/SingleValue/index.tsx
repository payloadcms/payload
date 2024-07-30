'use client'
import type { SingleValueProps } from 'react-select'

import React, { Fragment, useEffect, useState } from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../../types.js'

import { useDocumentDrawer } from '../../../../elements/DocumentDrawer/index.js'
import { Tooltip } from '../../../../elements/Tooltip/index.js'
import { EditIcon } from '../../../../icons/Edit/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'relationship--single-value'

export const SingleValue: React.FC<SingleValueProps<Option>> = (props) => {
  const {
    children,
    data: { label, relationTo, value },
    // @ts-expect-error-next-line // TODO Fix this - moduleResolution 16 breaks our declare module
    selectProps: { customProps: { onSave, setDrawerIsOpen } = {} } = {},
  } = props

  const [showTooltip, setShowTooltip] = useState(false)
  const { t } = useTranslation()
  const { permissions } = useAuth()
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read?.permission)

  const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen }] = useDocumentDrawer({
    id: value.toString(),
    collectionSlug: relationTo,
  })

  useEffect(() => {
    if (typeof setDrawerIsOpen === 'function') {
      setDrawerIsOpen(isDrawerOpen)
    }
  }, [isDrawerOpen, setDrawerIsOpen])

  return (
    <React.Fragment>
      <SelectComponents.SingleValue {...props} className={baseClass}>
        <div className={`${baseClass}__label`}>
          <div className={`${baseClass}__label-text`}>
            <div className={`${baseClass}__text`}>{children}</div>
            {relationTo && hasReadPermission && (
              <Fragment>
                <DocumentDrawerToggler
                  aria-label={t('general:editLabel', { label })}
                  className={`${baseClass}__drawer-toggler`}
                  onClick={() => setShowTooltip(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onTouchEnd={(e) => e.stopPropagation()} // prevents react-select dropdown from opening
                >
                  <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
                    {t('general:edit')}
                  </Tooltip>
                  <EditIcon />
                </DocumentDrawerToggler>
              </Fragment>
            )}
          </div>
        </div>
        {relationTo && hasReadPermission && <DocumentDrawer onSave={onSave} />}
      </SelectComponents.SingleValue>
    </React.Fragment>
  )
}
