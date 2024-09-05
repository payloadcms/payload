'use client'
import type { SingleValueProps } from 'react-select'

import React, { useCallback, useEffect, useState } from 'react'
import { components as SelectComponents } from 'react-select'

import type { DocumentInfoContext } from '../../../../providers/DocumentInfo/types.js'
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
    selectProps: {
      // @ts-expect-error // TODO Fix this - moduleResolution 16 breaks our declare module
      customProps: {
        // @ts-expect-error
        onCreate,
        // @ts-expect-error
        onDelete: onDeleteFromProps,
        // @ts-expect-error
        onDuplicate,
        // @ts-expect-error
        onSave,
        // @ts-expect-error
        setDrawerIsOpen,
      } = {},
    } = {},
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

  const onDelete = useCallback<DocumentInfoContext['onDelete']>(
    (args) => {
      setDrawerIsOpen(false)
      if (typeof onDeleteFromProps === 'function') {
        void onDeleteFromProps(args)
      }
    },
    [onDeleteFromProps, setDrawerIsOpen],
  )

  return (
    <SelectComponents.SingleValue {...props} className={baseClass}>
      <div className={`${baseClass}__label`}>
        <div className={`${baseClass}__label-text`}>
          <div className={`${baseClass}__text`}>{children}</div>
          {relationTo && hasReadPermission && (
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
          )}
        </div>
      </div>
      {relationTo && hasReadPermission && (
        <DocumentDrawer
          onCreate={onCreate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onSave={onSave}
        />
      )}
    </SelectComponents.SingleValue>
  )
}
