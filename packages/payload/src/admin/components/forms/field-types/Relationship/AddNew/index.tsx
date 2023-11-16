import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'
import type { EditViewProps } from '../../../../views/types'
import type { Value } from '../types'
import type { Props } from './types'

import { getTranslation } from '../../../../../../utilities/getTranslation'
import Button from '../../../../elements/Button'
import { useDocumentDrawer } from '../../../../elements/DocumentDrawer'
import Popup from '../../../../elements/Popup'
import * as PopupList from '../../../../elements/Popup/PopupButtonList'
import Tooltip from '../../../../elements/Tooltip'
import Plus from '../../../../icons/Plus'
import { useAuth } from '../../../../utilities/Auth'
import { useConfig } from '../../../../utilities/Config'
import './index.scss'
import { useRelatedCollections } from './useRelatedCollections'

const baseClass = 'relationship-add-new'

export const AddNewRelation: React.FC<Props> = ({
  dispatchOptions,
  hasMany,
  path,
  relationTo,
  setValue,
  value,
}) => {
  const relatedCollections = useRelatedCollections(relationTo)
  const { permissions } = useAuth()
  const [show, setShow] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string>()
  const relatedToMany = relatedCollections.length > 1
  const [collectionConfig, setCollectionConfig] = useState<SanitizedCollectionConfig>(() =>
    !relatedToMany ? relatedCollections[0] : undefined,
  )
  const [popupOpen, setPopupOpen] = useState(false)
  const { i18n, t } = useTranslation('fields')
  const [showTooltip, setShowTooltip] = useState(false)
  const config = useConfig()

  const [DocumentDrawer, DocumentDrawerToggler, { isDrawerOpen, toggleDrawer }] = useDocumentDrawer(
    {
      collectionSlug: collectionConfig?.slug,
    },
  )

  const onSave: EditViewProps['onSave'] = useCallback(
    ({ doc, operation }) => {
      if (operation === 'create') {
        const newValue: Value = Array.isArray(relationTo)
          ? {
              relationTo: collectionConfig.slug,
              value: doc.id,
            }
          : doc.id

        // ensure the value is not already in the array
        const isNewValue =
          Array.isArray(relationTo) && Array.isArray(value)
            ? !value.some((v) => v && typeof v === 'object' && v.value === doc.id)
            : value !== doc.id

        if (isNewValue) {
          dispatchOptions({
            collection: collectionConfig,
            config,
            docs: [doc],
            i18n,
            sort: true,
            type: 'ADD',
          })

          if (hasMany) {
            setValue([...(Array.isArray(value) ? value : []), newValue])
          } else {
            setValue(newValue)
          }
        }

        setSelectedCollection(undefined)
      }
    },
    [relationTo, collectionConfig, dispatchOptions, i18n, hasMany, setValue, value, config],
  )

  const onPopupToggle = useCallback((state) => {
    setPopupOpen(state)
  }, [])

  useEffect(() => {
    if (permissions) {
      if (relatedCollections.length === 1) {
        setShow(permissions.collections[relatedCollections[0].slug].create.permission)
      } else {
        setShow(
          relatedCollections.some(
            (collection) => permissions.collections[collection.slug].create.permission,
          ),
        )
      }
    }
  }, [permissions, relatedCollections])

  useEffect(() => {
    if (relatedToMany && selectedCollection) {
      setCollectionConfig(
        relatedCollections.find((collection) => collection.slug === selectedCollection),
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

  if (show) {
    return (
      <div className={baseClass} id={`${path}-add-new`}>
        {relatedCollections.length === 1 && (
          <Fragment>
            <DocumentDrawerToggler
              className={`${baseClass}__add-button`}
              onClick={() => setShowTooltip(false)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
                {t('addNewLabel', {
                  label: getTranslation(relatedCollections[0].labels.singular, i18n),
                })}
              </Tooltip>
              <Plus />
            </DocumentDrawerToggler>
            <DocumentDrawer onSave={onSave} />
          </Fragment>
        )}
        {relatedCollections.length > 1 && (
          <Fragment>
            <Popup
              button={
                <Button
                  buttonStyle="none"
                  className={`${baseClass}__add-button`}
                  tooltip={popupOpen ? undefined : t('addNew')}
                >
                  <Plus />
                </Button>
              }
              buttonType="custom"
              horizontalAlign="center"
              onToggleOpen={onPopupToggle}
              render={({ close: closePopup }) => (
                <PopupList.ButtonGroup>
                  {relatedCollections.map((relatedCollection) => {
                    if (permissions.collections[relatedCollection.slug].create.permission) {
                      return (
                        <PopupList.Button
                          className={`${baseClass}__relation-button--${relatedCollection.slug}`}
                          key={relatedCollection.slug}
                          onClick={() => {
                            closePopup()
                            setSelectedCollection(relatedCollection.slug)
                          }}
                        >
                          {getTranslation(relatedCollection.labels.singular, i18n)}
                        </PopupList.Button>
                      )
                    }

                    return null
                  })}
                </PopupList.ButtonGroup>
              )}
              size="medium"
            />
            {collectionConfig &&
              permissions.collections[collectionConfig.slug].create.permission && (
                <DocumentDrawer onSave={onSave} />
              )}
          </Fragment>
        )}
      </div>
    )
  }
  return null
}
