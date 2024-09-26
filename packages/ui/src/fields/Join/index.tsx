'use client'

import type { JoinFieldClient, JoinFieldClientComponent, PaginatedDocs, Where } from 'payload'

import React, { useMemo } from 'react'

import { RelationshipTable } from '../../elements/RelationshipTable/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { fieldBaseClass } from '../index.js'

const JoinFieldComponent: JoinFieldClientComponent = (props) => {
  const {
    field,
    field: { name, _path: pathFromProps, collection, on },
    Label,
  } = props

  const { id: docID } = useDocumentInfo()

  const { path: pathFromContext } = useFieldProps()

  const { value } = useField<PaginatedDocs>({
    path: pathFromContext ?? pathFromProps ?? name,
  })

  const filterOptions: Where = useMemo(
    () => ({
      [on]: {
        in: [docID || null],
      },
    }),
    [docID, on],
  )

  return (
    <div className={[fieldBaseClass, 'join'].filter(Boolean).join(' ')}>
      <RelationshipTable
        field={field as JoinFieldClient}
        filterOptions={filterOptions}
        initialData={docID && value ? value : ({ docs: [] } as PaginatedDocs)}
        initialDrawerState={{
          [on]: {
            initialValue: docID,
            valid: true,
            value: docID,
          },
        }}
        Label={<h4 style={{ margin: 0 }}>{Label}</h4>}
        relationTo={collection}
      />
    </div>
  )
}

export const JoinField = withCondition(JoinFieldComponent)
