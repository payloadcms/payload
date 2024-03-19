'use client'

import type { ClientCollectionConfig, FilterOptionsResult, UploadField } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useState } from 'react'

import type { DocumentDrawerProps } from '../../../elements/DocumentDrawer/types.js'
import type { ListDrawerProps } from '../../../elements/ListDrawer/types.js'
import type { UploadFieldProps } from './types.js'

import { Button } from '../../../elements/Button/index.js'
import { useDocumentDrawer } from '../../../elements/DocumentDrawer/index.js'
import FileDetails from '../../../elements/FileDetails/index.js'
import { useListDrawer } from '../../../elements/ListDrawer/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import LabelComp from '../../Label/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'

const baseClass = 'upload'

export type UploadInputProps = Omit<UploadFieldProps, 'filterOptions'> & {
  api?: string
  collection?: ClientCollectionConfig
  filterOptions?: FilterOptionsResult
  onChange?: (e) => void
  relationTo?: UploadField['relationTo']
  serverURL?: string
  showError?: boolean
  value?: string
}

export const UploadInput: React.FC<UploadInputProps> = (props) => {
  const {
    Description,
    Error,
    Label: LabelFromProps,
    api = '/api',
    className,
    collection,
    filterOptions,
    label,
    onChange,
    readOnly,
    relationTo,
    required,
    serverURL,
    showError,
    style,
    value,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const { i18n, t } = useTranslation()

  const [file, setFile] = useState(undefined)
  const [missingFile, setMissingFile] = useState(false)
  const [collectionSlugs] = useState([collection?.slug])

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    collectionSlug: collectionSlugs[0],
  })

  const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer }] = useListDrawer({
    collectionSlugs,
    filterOptions,
  })

  useEffect(() => {
    if (value !== null && typeof value !== 'undefined' && value !== '') {
      const fetchFile = async () => {
        const response = await fetch(`${serverURL}${api}/${relationTo}/${value}`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        })
        if (response.ok) {
          const json = await response.json()
          setFile(json)
        } else {
          setMissingFile(true)
          setFile(undefined)
        }
      }

      void fetchFile()
    } else {
      setFile(undefined)
    }
  }, [value, relationTo, api, serverURL, i18n])

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      setMissingFile(false)
      onChange(args.doc)
      closeDrawer()
    },
    [onChange, closeDrawer],
  )

  const onSelect = useCallback<ListDrawerProps['onSelect']>(
    (args) => {
      setMissingFile(false)
      onChange({
        id: args.docID,
      })
      closeListDrawer()
    },
    [onChange, closeListDrawer],
  )

  if (collection.upload) {
    return (
      <div
        className={[
          fieldBaseClass,
          baseClass,
          className,
          showError && 'error',
          readOnly && 'read-only',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...style,
          width,
        }}
      >
        {Error}
        {Label}
        {collection?.upload && (
          <React.Fragment>
            {file && !missingFile && (
              <FileDetails
                collectionSlug={relationTo}
                doc={file}
                handleRemove={
                  readOnly
                    ? undefined
                    : () => {
                        onChange(null)
                      }
                }
                uploadConfig={collection.upload}
              />
            )}
            {(!file || missingFile) && (
              <div className={`${baseClass}__wrap`}>
                <div className={`${baseClass}__buttons`}>
                  <DocumentDrawerToggler className={`${baseClass}__toggler`} disabled={readOnly}>
                    <Button buttonStyle="secondary" disabled={readOnly} el="div">
                      {t('fields:uploadNewLabel', {
                        label: getTranslation(collection.labels.singular, i18n),
                      })}
                    </Button>
                  </DocumentDrawerToggler>
                  <ListDrawerToggler className={`${baseClass}__toggler`} disabled={readOnly}>
                    <Button buttonStyle="secondary" disabled={readOnly} el="div">
                      {t('fields:chooseFromExisting')}
                    </Button>
                  </ListDrawerToggler>
                </div>
              </div>
            )}
            {Description}
          </React.Fragment>
        )}
        {!readOnly && <DocumentDrawer onSave={onSave} />}
        {!readOnly && <ListDrawer onSelect={onSelect} />}
      </div>
    )
  }

  return null
}
