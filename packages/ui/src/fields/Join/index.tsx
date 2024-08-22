'use client'

import type { JoinFieldProps, PaginatedDocs } from 'payload'

import React from 'react'

import { RelationshipTable } from '../../elements/RelationshipTable/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'

const JoinFieldComponent: React.FC<JoinFieldProps> = (props) => {
  const {
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        components: { Label },
      },
      collection,
      label,
      on,
    },
  } = props

  const { id: docID } = useDocumentInfo()

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { path, value } = useField<PaginatedDocs>({
    path: pathFromContext ?? pathFromProps ?? name,
  })

  return (
    <RelationshipTable
      Label={
        <h4 style={{ margin: 0 }}>
          <FieldLabel Label={Label} as="span" field={field} label={label} />
        </h4>
      }
      field={field}
      filterOptions={{
        [on]: {
          in: [docID],
        },
      }}
      initialData={value}
      relationTo={collection}
    />
  )
}

export const JoinField = withCondition(JoinFieldComponent)
