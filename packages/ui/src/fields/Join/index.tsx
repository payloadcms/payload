'use client'

import type { JoinFieldClient, JoinFieldClientComponent, PaginatedDocs, Where } from 'payload'

import React, { useMemo } from 'react'

import { RelationshipTable } from '../../elements/RelationshipTable/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../index.js'

const JoinFieldComponent: JoinFieldClientComponent = (props) => {
  const {
    field,
    field: { name, _schemaPath, collection, label, localized, on, required },
    fieldState: {
      customComponents: { AfterInput, BeforeInput, Label },
    },
    path: pathFromProps,
  } = props
  const path = pathFromProps || name

  const { id: docID } = useDocumentInfo()

  const { value } = useField<PaginatedDocs>({
    path,
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
      {BeforeInput}
      <RelationshipTable
        field={field as JoinFieldClient}
        filterOptions={filterOptions}
        initialData={docID && value ? value : ({ docs: [] } as PaginatedDocs)}
        initialDrawerState={{
          [on]: {
            initialValue: docID,
            schemaPath: _schemaPath,
            valid: true,
            value: docID,
          },
        }}
        Label={
          <h4 style={{ margin: 0 }}>
            <RenderCustomComponent
              CustomComponent={Label}
              Fallback={
                <FieldLabel label={label} localized={localized} path={path} required={required} />
              }
            />
          </h4>
        }
        relationTo={collection}
      />
      {AfterInput}
    </div>
  )
}

export const JoinField = withCondition(JoinFieldComponent)
