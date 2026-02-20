'use client'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { hasAutosaveEnabled } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useState } from 'react'

import type { DocumentDrawerContextType } from '../DocumentDrawer/Provider.js'
import type { Props } from './types.js'

import { useRelatedCollections } from '../../hooks/useRelatedCollections.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { Popup } from '../Popup/index.js'
import * as PopupList from '../Popup/PopupButtonList/index.js'
import './index.scss'
import { Tooltip } from '../Tooltip/index.js'

const baseClass = 'relationship-add-new'

export const AddNewRelation: React.FC<Props> = ({
  Button: ButtonFromProps,
  hasMany,
  onChange,
  path,
  relationTo,
  unstyled,
  value,
}) => {
  const relatedCollections = useRelatedCollections(relationTo)
  const { permissions } = useAuth()
  const [show, setShow] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string>()

  const relatedToMany = relatedCollections.length > 1

  const [collectionConfig, setCollectionConfig] = useState<ClientCollectionConfig>(() =>
    !relatedToMany ? relatedCollections[0] : undefined,
  )

  const [popupOpen, setPopupOpen] = useState(false)
  const { i18n, t } = useTranslation()
  const [showTooltip, setShowTooltip] = useState(false)

  const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen, toggleDrawer }] = useDocumentDrawer(
    {
      collectionSlug: collectionConfig?.slug,
    },
  )

  const onSave: DocumentDrawerContextType['onSave'] = useCallback(
    ({ doc, operation }) => {
      // if autosave is enabled, the operation will be 'update'
      if (
        operation === 'create' ||
        (operation === 'update' && hasAutosaveEnabled(collectionConfig))
      ) {
        // ensure the value is not already in the array
        let isNewValue = false
        if (!value) {
          isNewValue = true
        } else {
          isNewValue = Array.isArray(value)
            ? !value.some((v) => v && v.value === doc.id)
            : value.value !== doc.id
        }

        if (isNewValue) {
          if (hasMany === true) {
            onChange([
              ...(Array.isArray(value) ? value : []),
              {
                relationTo: collectionConfig?.slug,
                value: doc.id,
              },
            ])
          } else {
            onChange({
              relationTo: collectionConfig?.slug,
              value: doc.id,
            })
          }
        }

        setSelectedCollection(undefined)
      }
    },
    [collectionConfig, hasMany, onChange, value],
  )

  const onPopupToggle = useCallback((state) => {
    setPopupOpen(state)
  }, [])

  useEffect(() => {
    if (permissions) {
      if (relatedCollections.length === 1) {
        setShow(permissions.collections[relatedCollections[0]?.slug]?.create)
      } else {
        setShow(
          relatedCollections.some(
            (collection) => permissions.collections[collection?.slug]?.create,
          ),
        )
      }
    }
  }, [permissions, relatedCollections])

  useEffect(() => {
    if (relatedToMany && selectedCollection) {
      setCollectionConfig(
        relatedCollections.find((collection) => collection?.slug === selectedCollection),
      )
    }
  }, [selectedCollection, relatedToMany, relatedCollections])

  useEffect(() => {
    if (relatedToMany && collectionConfig) {
      // the drawer must be rendered on the page before before opening it
      // this is why 'selectedCollection' is different from 'collectionConfig'
      toggleDrawer()
      setSelectedCollection(undefined)
    }
  }, [toggleDrawer, relatedToMany, collectionConfig])

  useEffect(() => {
    if (relatedToMany && !isDrawerOpen) {
      setCollectionConfig(undefined)
    }
  }, [isDrawerOpen, relatedToMany])

  const label = t('fields:addNewLabel', {
    label: getTranslation(relatedCollections[0]?.labels.singular, i18n),
  })

  if (!show) {
    return null
  }

  return (
    <div className={baseClass} id={`${path}-add-new`}>
      {relatedCollections.length === 1 && (
        <Fragment>
          <DocumentDrawerToggler
            className={[
              `${baseClass}__add-button`,
              unstyled && `${baseClass}__add-button--unstyled`,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              setShowTooltip(false)
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {ButtonFromProps ? (
              ButtonFromProps
            ) : (
              <Fragment>
                <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
                  {label}
                </Tooltip>
                <PlusIcon />
              </Fragment>
            )}
          </DocumentDrawerToggler>
          <DocumentDrawer onSave={onSave} />
        </Fragment>
      )}
      {relatedCollections.length > 1 && (
        <Fragment>
          <Popup
            button={
              ButtonFromProps ? (
                ButtonFromProps
              ) : (
                <Button
                  buttonStyle="none"
                  className={`${baseClass}__add-button`}
                  tooltip={popupOpen ? undefined : t('fields:addNew')}
                >
                  <PlusIcon />
                </Button>
              )
            }
            buttonType="custom"
            horizontalAlign="center"
            onToggleOpen={onPopupToggle}
            render={({ close: closePopup }) => (
              <PopupList.ButtonGroup>
                {relatedCollections.map((relatedCollection) => {
                  if (permissions.collections[relatedCollection?.slug]?.create) {
                    return (
                      <PopupList.Button
                        className={`${baseClass}__relation-button--${relatedCollection?.slug}`}
                        key={relatedCollection?.slug}
                        onClick={() => {
                          closePopup()
                          setSelectedCollection(relatedCollection?.slug)
                        }}
                      >
                        {getTranslation(relatedCollection?.labels?.singular, i18n)}
                      </PopupList.Button>
                    )
                  }

                  return null
                })}
              </PopupList.ButtonGroup>
            )}
            size="medium"
          />
          {collectionConfig && permissions.collections[collectionConfig?.slug]?.create && (
            <DocumentDrawer onSave={onSave} />
          )}
        </Fragment>
      )}
    </div>
  )
}
