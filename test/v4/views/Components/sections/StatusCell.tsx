'use client'

import type { CollectionSlug } from 'payload'

import { StatusCell } from '@payloadcms/ui/elements/Table/DefaultCell/fields/Status'
import React from 'react'

import { Section, Variant } from '../shared.js'

const mockField = {
  name: '_status',
  type: 'select' as const,
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Changed', value: 'changed' },
    { label: 'Previously Published', value: 'previouslyPublished' },
  ],
}

const mockCollectionSlug = 'users' as CollectionSlug

export const StatusCellSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section id="status-cell" selectedComponent={selectedComponent} title="Status Cell">
    <Variant label="Published">
      <StatusCell
        cellData="published"
        collectionSlug={mockCollectionSlug}
        field={mockField}
        rowData={{}}
      />
    </Variant>
    <Variant label="Draft">
      <StatusCell
        cellData="draft"
        collectionSlug={mockCollectionSlug}
        field={mockField}
        rowData={{}}
      />
    </Variant>
    <Variant label="Changed">
      <StatusCell
        cellData="changed"
        collectionSlug={mockCollectionSlug}
        field={mockField}
        rowData={{}}
      />
    </Variant>
    <Variant label="Previously Published">
      <StatusCell
        cellData="previouslyPublished"
        collectionSlug={mockCollectionSlug}
        field={mockField}
        rowData={{}}
      />
    </Variant>
  </Section>
)
