'use client'
import type { FilterOptionsResult, PaginatedDocs, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import type { useSelection } from '../../../providers/Selection/index.js'
import type { UploadFieldPropsWithContext } from '../HasOne/index.js'

import { AddNewRelation } from '../../../elements/AddNewRelation/index.js'
import { Button } from '../../../elements/Button/index.js'
import { DraggableSortable } from '../../../elements/DraggableSortable/index.js'
import { FileDetails } from '../../../elements/FileDetails/index.js'
import { useListDrawer } from '../../../elements/ListDrawer/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

const baseClass = 'upload upload--has-many'

import './index.scss'

export const UploadComponentHasMany: React.FC<
  {
    fileDocs: PaginatedDocs['docs']
  } & UploadFieldPropsWithContext<string[]>
> = (props) => {
  const {
    canCreate,
    field: {
      _path,
      admin: { isSortable },
      hasMany,
      relationTo,
    },
    fieldHookResult: { filterOptions: filterOptionsFromProps, setValue, value },
    fileDocs,
    onChange,
    readOnly,
  } = props

  const { t } = useTranslation()

  const {
    config: { collections },
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

  function moveItemInArray<T>(array: T[], moveFromIndex: number, moveToIndex: number): T[] {
    const newArray = [...array]
    const [item] = newArray.splice(moveFromIndex, 1)

    newArray.splice(moveToIndex, 0, item)

    return newArray
  }

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      const updatedArray = moveItemInArray(value, moveFromIndex, moveToIndex)
      onChange(updatedArray)
    },
    [value, onChange],
  )

  const removeItem = useCallback(
    (index: number) => {
      const updatedArray = [...(value || [])]
      updatedArray.splice(index, 1)
      onChange(updatedArray)
    },
    [value, onChange],
  )

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs:
      typeof relationTo === 'string'
        ? [relationTo]
        : collections.map((collection) => collection.slug),
    filterOptions,
  })

  const collection = collections.find((coll) => coll.slug === relationTo)

  const onListSelect = useCallback(
    (selections: ReturnType<typeof useSelection>['selected']) => {
      const selectedIDs = Object.entries(selections).reduce(
        (acc, [key, value]) => (value ? [...acc, key] : acc),
        [] as string[],
      )
      onChange(selectedIDs)
    },
    [onChange],
  )

  return (
    <Fragment>
      <div className={[baseClass].join(' ')}>
        <DraggableSortable
          className={`${baseClass}__draggable-rows`}
          ids={value.map((id) => String(id))}
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
      </div>

      <div className={[`${baseClass}__controls`].join(' ')}>
        <div className={[`${baseClass}__buttons`].join(' ')}>
          {canCreate && hasMany && (
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
        {hasMany && (
          <button className={`${baseClass}__clear-all`} onClick={() => setValue([])} type="button">
            Clear all
          </button>
        )}
      </div>
      <ListDrawer
        enableRowSelections={hasMany}
        onBulkSelect={onListSelect}
        onSelect={({ docID }) => onListSelect({ [docID]: true })}
      />
    </Fragment>
  )
}
