'use client'

import type {
  ClientConfig,
  ClientField,
  JoinFieldClient,
  JoinFieldClientComponent,
  PaginatedDocs,
  Where,
} from 'payload'

import ObjectIdImport from 'bson-objectid'
import { flattenTopLevelFields } from 'payload/shared'
import React, { useMemo } from 'react'

import { RelationshipTable } from '../../elements/RelationshipTable/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../index.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

/**
 * Recursively builds the default data for joined collection
 */
const getInitialDrawerData = ({
  collectionSlug,
  config,
  docID,
  fields,
  segments,
}: {
  collectionSlug: string
  config: ClientConfig
  docID: number | string
  fields: ClientField[]
  segments: string[]
}) => {
  const flattenedFields = flattenTopLevelFields(fields)

  const path = segments[0]

  const field = flattenedFields.find((field) => field.name === path)

  if (!field) {
    return null
  }

  if (field.type === 'relationship' || field.type === 'upload') {
    let value: { relationTo: string; value: number | string } | number | string = docID
    if (Array.isArray(field.relationTo)) {
      value = {
        relationTo: collectionSlug,
        value: docID,
      }
    }
    return {
      [field.name]: field.hasMany ? [value] : value,
    }
  }

  const nextSegments = segments.slice(1, segments.length)

  if (field.type === 'tab' || field.type === 'group') {
    return {
      [field.name]: getInitialDrawerData({
        collectionSlug,
        config,
        docID,
        fields: field.fields,
        segments: nextSegments,
      }),
    }
  }

  if (field.type === 'array') {
    const initialData = getInitialDrawerData({
      collectionSlug,
      config,
      docID,
      fields: field.fields,
      segments: nextSegments,
    })

    initialData.id = ObjectId().toHexString()

    return {
      [field.name]: [initialData],
    }
  }

  if (field.type === 'blocks') {
    for (const _block of field.blockReferences ?? field.blocks) {
      const block = typeof _block === 'string' ? config.blocksMap[_block] : _block

      const blockInitialData = getInitialDrawerData({
        collectionSlug,
        config,
        docID,
        fields: block.fields,
        segments: nextSegments,
      })

      if (blockInitialData) {
        blockInitialData.id = ObjectId().toHexString()
        blockInitialData.blockType = block.slug

        return {
          [field.name]: [blockInitialData],
        }
      }
    }
  }
}

const JoinFieldComponent: JoinFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { allowCreate, description },
      collection,
      label,
      localized,
      on,
      required,
    },
    path,
  } = props

  const { id: docID, docConfig } = useDocumentInfo()

  const { config, getEntityConfig } = useConfig()

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    showError,
    value,
  } = useField<PaginatedDocs>({
    path,
  })

  const filterOptions: null | Where = useMemo(() => {
    if (!docID) {
      return null
    }

    let value: { relationTo: string; value: number | string } | number | string = docID

    if (Array.isArray(field.targetField.relationTo)) {
      value = {
        relationTo: docConfig.slug,
        value,
      }
    }

    const where = Array.isArray(collection)
      ? {}
      : {
          [on]: {
            equals: value,
          },
        }

    if (field.where) {
      return {
        and: [where, field.where],
      }
    }

    return where
  }, [docID, collection, field.targetField.relationTo, field.where, on, docConfig?.slug])

  const initialDrawerData = useMemo(() => {
    const relatedCollection = getEntityConfig({
      collectionSlug: Array.isArray(field.collection) ? field.collection[0] : field.collection,
    })

    return getInitialDrawerData({
      collectionSlug: docConfig?.slug,
      config,
      docID,
      fields: relatedCollection.fields,
      segments: field.on.split('.'),
    })
  }, [getEntityConfig, field.collection, field.on, docConfig?.slug, docID, config])

  if (!docConfig) {
    return null
  }

  return (
    <div
      className={[fieldBaseClass, showError && 'error', 'join'].filter(Boolean).join(' ')}
      id={`field-${path?.replace(/\./g, '__')}`}
    >
      <RenderCustomComponent
        CustomComponent={Error}
        Fallback={<FieldError path={path} showError={showError} />}
      />
      <RelationshipTable
        AfterInput={AfterInput}
        allowCreate={typeof docID !== 'undefined' && allowCreate}
        BeforeInput={BeforeInput}
        disableTable={filterOptions === null}
        field={field as JoinFieldClient}
        filterOptions={filterOptions}
        initialData={docID && value ? value : ({ docs: [] } as PaginatedDocs)}
        initialDrawerData={initialDrawerData}
        Label={
          <h4 style={{ margin: 0 }}>
            {Label || (
              <FieldLabel label={label} localized={localized} path={path} required={required} />
            )}
          </h4>
        }
        parent={
          Array.isArray(collection)
            ? {
                id: docID,
                collectionSlug: docConfig.slug,
                joinPath: path,
              }
            : undefined
        }
        relationTo={collection}
      />
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description} path={path} />}
      />
    </div>
  )
}

export const JoinField = withCondition(JoinFieldComponent)
