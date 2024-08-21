'use client'
import type { Where } from 'payload'

import * as qs from 'qs-esm'
import { useCallback, useEffect, useState } from 'react'

import type { UploadFieldPropsWithContext } from '../HasOne/index.js'

import { DraggableSortableItem } from '../../../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../../../elements/DraggableSortable/index.js'
import { FileDetails } from '../../../elements/FileDetails/index.js'
import { DragHandleIcon } from '../../../icons/DragHandle/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { baseClass } from '../index.js'
import './index.scss'

export const UploadComponentHasMany: React.FC<UploadFieldPropsWithContext> = (props) => {
  const {
    field: {
      _path: path,
      admin: { isSortable },
      relationTo,
    },
    fieldHookResult,
  } = props

  const {
    config: {
      collections,
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const [fileDocs, setFileDocs] = useState([])
  const [missingFiles, setMissingFiles] = useState(false)

  const { i18n, t } = useTranslation()
  const { code } = useLocale()
  const { setValue, value } = fieldHookResult

  useEffect(() => {
    if (value !== null && typeof value !== 'undefined' && value !== '') {
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
    } else {
      setFileDocs([])
    }
  }, [value, relationTo, api, serverURL, i18n, code])

  function moveItemInArray<T>(array: T[], moveFromIndex: number, moveToIndex: number): T[] {
    const item = array.splice(moveFromIndex, 1)[0]
    array.splice(moveToIndex, 0, item)

    return array
  }

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      const updatedArray = moveItemInArray(value, moveFromIndex, moveToIndex)
      setValue(updatedArray)
    },
    [value, setValue],
  )

  if (typeof relationTo === 'string') {
    const collection = collections.find((coll) => coll.slug === relationTo)

    if (collection.upload) {
      return (
        <div className={[baseClass].join(' ')}>
          <div>
            <DraggableSortable
              className={`${baseClass}__draggable-rows`}
              ids={fileDocs.map((doc) => doc.id)}
              onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
            >
              {Boolean(value.length) &&
                value.map((id) => {
                  const doc = fileDocs.find((doc) => doc.id === id)
                  const uploadConfig = collections.find((coll) => coll.slug === relationTo)?.upload
                  return (
                    <DraggableSortableItem id={id} key={id}>
                      {(draggableSortableItemProps) => (
                        <div
                          className={[
                            baseClass,
                            draggableSortableItemProps && `${baseClass}--has-drag-handle`,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          ref={draggableSortableItemProps.setNodeRef}
                          style={{
                            transform: draggableSortableItemProps.transform,
                            transition: draggableSortableItemProps.transition,
                            zIndex: draggableSortableItemProps.isDragging ? 1 : undefined,
                          }}
                        >
                          {draggableSortableItemProps && (
                            <div
                              className={`${baseClass}__drag`}
                              {...draggableSortableItemProps.attributes}
                              {...draggableSortableItemProps.listeners}
                            >
                              <DragHandleIcon />
                            </div>
                          )}
                          {doc && (
                            <FileDetails
                              collectionSlug={relationTo}
                              doc={doc}
                              hasMany={true}
                              isSortable={isSortable}
                              uploadConfig={uploadConfig}
                            />
                          )}
                        </div>
                      )}
                    </DraggableSortableItem>
                  )
                })}
            </DraggableSortable>
          </div>
          <div className={[`${baseClass}__controls`].join(' ')}>
            <div className={[`${baseClass}__buttons`].join(' ')}>
              <div>Create new</div>
              <div>Add existing</div>
            </div>
            <div>Clear all</div>
          </div>
        </div>
      )
    }

    return null
  }

  return <div>Polymorphic Has Many Uploads Go Here</div>
}
