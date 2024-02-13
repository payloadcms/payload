'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { useConfig } from '../../../providers/Config'
import useField from '../../useField'
import { useTranslation } from '../../../providers/Translation'
import type { DocumentDrawerProps } from '../../../elements/DocumentDrawer/types'
import type { ListDrawerProps } from '../../../elements/ListDrawer/types'
import type { FilterOptionsResult } from '../Relationship/types'
import { getTranslation } from '@payloadcms/translations'
import { Button } from '../../../elements/Button'
import { useDocumentDrawer } from '../../../elements/DocumentDrawer'
import FileDetails from '../../../elements/FileDetails'
import { useListDrawer } from '../../../elements/ListDrawer'
import { GetFilterOptions } from '../../../elements/GetFilterOptions'
import { fieldBaseClass } from '../shared'
import LabelComp from '../../Label'

import './index.scss'

const baseClass = 'upload'

const Upload: React.FC<Props> = (props) => {
  const {
    className,
    Description,
    readOnly,
    style,
    width,
    Error,
    Label: LabelFromProps,
    label,
    filterOptions,
    path: pathFromProps,
    relationTo,
    required,
    validate,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const collection = collections.find((coll) => coll.slug === relationTo)

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { setValue, showError, value, path } = useField({
    path: pathFromProps,
    validate: memoizedValidate,
  })

  const onChange = useCallback(
    (incomingValue) => {
      const incomingID = incomingValue?.id || incomingValue
      setValue(incomingID)
    },
    [setValue],
  )

  const { i18n, t } = useTranslation()

  const [file, setFile] = useState(undefined)
  const [missingFile, setMissingFile] = useState(false)
  const [collectionSlugs] = useState([collection?.slug])
  const [filterOptionsResult, setFilterOptionsResult] = useState<FilterOptionsResult>()

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    collectionSlug: collectionSlugs[0],
  })

  const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer }] = useListDrawer({
    collectionSlugs,
    filterOptions: filterOptionsResult,
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

      fetchFile()
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
        {/* <GetFilterOptions
          {...{
            filterOptions,
            filterOptionsResult,
            path,
            relationTo,
            setFilterOptionsResult,
          }}
        /> */}
        {Error}
        {Label}
        {collection?.upload && (
          <React.Fragment>
            {file && !missingFile && (
              <FileDetails
                uploadConfig={collection.upload}
                collectionSlug={relationTo}
                doc={file}
                handleRemove={
                  readOnly
                    ? undefined
                    : () => {
                        onChange(null)
                      }
                }
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

export default Upload
