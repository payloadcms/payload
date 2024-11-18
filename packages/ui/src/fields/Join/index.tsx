'use client'

import type { JoinFieldClient, JoinFieldClientComponent, PaginatedDocs, Where } from 'payload'

import React, { useMemo } from 'react'

import { RelationshipTable } from '../../elements/RelationshipTable/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../index.js'

const JoinFieldComponent: JoinFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { allowCreate },
      collection,
      label,
      localized,
      on,
      required,
    },
    path,
  } = props

  const { id: docID } = useDocumentInfo()

  const { customComponents: { AfterInput, BeforeInput, Label } = {}, value } =
    useField<PaginatedDocs>({
      path,
    })

  const filterOptions: null | Where = useMemo(() => {
    if (!docID) {
      return null
    }

    const where = {
      [on]: {
        equals: docID,
      },
    }

    if (field.where) {
      return {
        and: [where, field.where],
      }
    }

    return where
  }, [docID, on, field.where])

  return (
    <div className={[fieldBaseClass, 'join'].filter(Boolean).join(' ')}>
      {BeforeInput}
      <RelationshipTable
        allowCreate={typeof docID !== 'undefined' && allowCreate}
        disableTable={filterOptions === null}
        field={field as JoinFieldClient}
        filterOptions={filterOptions}
        initialData={docID && value ? value : ({ docs: [] } as PaginatedDocs)}
        initialDrawerData={{
          [on]: docID,
        }}
        Label={
          <h4 style={{ margin: 0 }}>
            {Label || (
              <FieldLabel label={label} localized={localized} path={path} required={required} />
            )}
          </h4>
        }
        relationTo={collection}
      />
      {AfterInput}
    </div>
  )
}

export const JoinField = withCondition(JoinFieldComponent)
