'use client'
import type { FilterOptionsResult, Where } from 'payload'

import * as qs from 'qs-esm'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import type { useSelection } from '../../../providers/Selection/index.js'
import type { UploadFieldPropsWithContext } from '../HasOne/index.js'

import { AddNewRelation } from '../../../elements/AddNewRelation/index.js'
import { Button } from '../../../elements/Button/index.js'
import { DraggableSortable } from '../../../elements/DraggableSortable/index.js'
import { FileDetails } from '../../../elements/FileDetails/index.js'
import { useListDrawer } from '../../../elements/ListDrawer/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { FieldLabel } from '../../FieldLabel/index.js'

const baseClass = 'upload upload--has-many'

import './index.scss'

export const UploadComponentHasMany: React.FC<UploadFieldPropsWithContext<string[]>> = (props) => {
  const {
    canCreate,
    field,
    field: {
      _path,
      admin: {
        components: { Label },
        isSortable,
      },
      hasMany,
      label,
      relationTo,
    },
    fieldHookResult: { filterOptions: filterOptionsFromProps, setValue, value },
    readOnly,
  } = props

  const { i18n, t } = useTranslation()

  const {
    config: {
      collections,
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const filterOptions: FilterOptionsResult = useMemo(() => {
    if (typeof relationTo === 'string') {
      return {
        ...filterOptionsFromProps,
        [relationTo]: {
          ...((filterOptionsFromProps?.[relationTo] as any) || {}),
          id: {
            ...((filterOptionsFromProps?.[relationTo] as any)?.id || {}),
            not_in: (filterOptionsFromProps?.[relationTo] as any)?.id?.not_in || value,
          },
        },
      }
    }
  }, [value, relationTo, filterOptionsFromProps])

  const [fileDocs, setFileDocs] = useState([])
  const [missingFiles, setMissingFiles] = useState(false)

  const { code } = useLocale()

  useEffect(() => {
    if (value !== null && typeof value !== 'undefined' && value.length !== 0) {
      const query: {
        [key: string]: unknown
        where: Where
      } = {
        depth: 0,
        draft: true,
        locale: code,
        where: {
          and: [
            {
              id: {
                in: value,
              },
            },
          ],
        },
      }

      const fetchFile = async () => {
        const response = await fetch(`${serverURL}${api}/${relationTo}`, {
          body: qs.stringify(query),
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-HTTP-Method-Override': 'GET',
          },
          method: 'POST',
        })
        if (response.ok) {
          const json = await response.json()
          setFileDocs(json.docs)
        } else {
          setMissingFiles(true)
          setFileDocs([])
        }
      }

      void fetchFile()
    }
  }, [value, relationTo, api, serverURL, i18n, code])

  function moveItemInArray<T>(array: T[], moveFromIndex: number, moveToIndex: number): T[] {
    const newArray = [...array]
    const [item] = newArray.splice(moveFromIndex, 1)

    newArray.splice(moveToIndex, 0, item)

    return newArray
  }

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      const updatedArray = moveItemInArray(value, moveFromIndex, moveToIndex)
      setValue(updatedArray)
    },
    [value, setValue],
  )

  const removeItem = useCallback(
    (index: number) => {
      const updatedArray = [...value]
      updatedArray.splice(index, 1)
      setValue(updatedArray)
    },
    [value, setValue],
  )

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs:
      typeof relationTo === 'string'
        ? [relationTo]
        : collections.map((collection) => collection.slug),
    filterOptions,
  })

  const collection = collections.find((coll) => coll.slug === relationTo)

  // Get the labels of the collections that the relation is to
  const labels = useMemo(() => {
    function joinWithCommaAndOr(items: string[]): string {
      const or = t('general:or')

      if (items.length === 0) return ''
      if (items.length === 1) return items[0]
      if (items.length === 2) return items.join(` ${or} `)

      return items.slice(0, -1).join(', ') + ` ${or} ` + items[items.length - 1]
    }

    const labels = []

    collections.forEach((collection) => {
      if (relationTo.includes(collection.slug)) {
        labels.push(collection.labels?.singular || collection.slug)
      }
    })

    return joinWithCommaAndOr(labels)
  }, [collections, relationTo, t])

  const onBulkSelect = useCallback(
    (selections: ReturnType<typeof useSelection>['selected']) => {
      const selectedIDs = Object.entries(selections).reduce(
        (acc, [key, value]) => (value ? [...acc, key] : acc),
        [] as string[],
      )
      if (value?.length) setValue([...value, ...selectedIDs])
      else setValue(selectedIDs)
    },
    [setValue, value],
  )

  return (
    <Fragment>
      <div className={[baseClass].join(' ')}>
        <FieldLabel Label={Label} field={field} label={label} />

        <div>
          {missingFiles || !value?.length ? (
            <div className={[`${baseClass}__no-data`].join(' ')}>
              {t('version:noRowsSelected', { label: labels })}
            </div>
          ) : (
            <DraggableSortable
              className={`${baseClass}__draggable-rows`}
              ids={value}
              onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
            >
              {Boolean(value.length) &&
                value.map((id, index) => {
                  const doc = fileDocs.find((doc) => doc.id === id)
                  const uploadConfig = collection?.upload

                  if (!doc) {
                    return null
                  }

                  return (
                    <FileDetails
                      collectionSlug={relationTo}
                      doc={doc}
                      hasMany={true}
                      isSortable={isSortable}
                      key={id}
                      removeItem={removeItem}
                      rowIndex={index}
                      uploadConfig={uploadConfig}
                    />
                  )
                })}
            </DraggableSortable>
          )}
        </div>

        <div className={[`${baseClass}__controls`].join(' ')}>
          <div className={[`${baseClass}__buttons`].join(' ')}>
            {canCreate && (
              <div className={[`${baseClass}__add-new`].join(' ')}>
                <AddNewRelation
                  Button={
                    <Button
                      buttonStyle="icon-label"
                      el="span"
                      icon="plus"
                      iconPosition="left"
                      iconStyle="with-border"
                    >
                      {t('fields:addNew')}
                    </Button>
                  }
                  hasMany={hasMany}
                  path={_path}
                  relationTo={relationTo}
                  setValue={setValue}
                  unstyled
                  value={value}
                />
              </div>
            )}
            <ListDrawerToggler className={`${baseClass}__toggler`} disabled={readOnly}>
              <div>
                <Button
                  buttonStyle="icon-label"
                  el="span"
                  icon="plus"
                  iconPosition="left"
                  iconStyle="with-border"
                >
                  {t('fields:chooseFromExisting')}
                </Button>
              </div>
            </ListDrawerToggler>
          </div>
          {Boolean(value.length) && (
            <button
              className={`${baseClass}__clear-all`}
              onClick={() => setValue([])}
              type="button"
            >
              {t('general:clearAll')}
            </button>
          )}
        </div>
      </div>
      <ListDrawer
        enableRowSelections
        onBulkSelect={onBulkSelect}
        onSelect={(selection) => {
          if (value?.length) setValue([...value, selection.docID])
          else setValue([selection.docID])
        }}
      />
    </Fragment>
  )
}
