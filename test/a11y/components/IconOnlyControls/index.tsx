'use client'

import type { Column, EditViewProps } from 'payload'

import {
  DocumentInfoProvider,
  DraggableSortable,
  FileDetails,
  Form,
  ListQueryProvider,
  OrderableTable,
  SortRow,
  Upload,
  useAuth,
  useConfig,
} from '@payloadcms/ui'
import React, { useState } from 'react'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- The optional draggable toolbar has no public export.
import { LivePreviewToolbar } from '../../../../packages/ui/src/elements/LivePreview/Toolbar/index.js'

const emptyState = {}
const fileState = { file: { initialValue: null, valid: true, value: null } }
const uploadConfig = { crop: false, displayPreview: false, focalPoint: false }
const file = {
  id: 'icon-only-file',
  filename: 'icon-only.png',
  filesize: 68,
  mimeType: 'image/png',
  url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1sAAAAASUVORK5CYII=',
}
const fileIDs = [file.id]
const rows = [{ id: 'row', _order: 'a0', title: 'Icon-only row' }]
const rowQuery = { sort: '_order' }
const columns: Column[] = [
  {
    accessor: '_dragHandle',
    active: true,
    field: { name: '_dragHandle', type: 'text' },
    Heading: 'Reorder',
    renderedCells: [<SortRow key="handle" />],
  },
  {
    accessor: 'title',
    active: true,
    field: { name: 'title', type: 'text' },
    Heading: 'Title',
    renderedCells: ['Icon-only row'],
  },
]

// Render control variants absent from the standard a11y fixture views.
export function IconOnlyControls(props: EditViewProps) {
  const { user } = useAuth()
  const { getEntityConfig } = useConfig()
  const [hasStaticFile, setHasStaticFile] = useState(true)
  const [hasSortableFile, setHasSortableFile] = useState(true)

  return (
    <div className="icon-only-controls">
      <h1>Icon-only controls</h1>
      <section aria-label="Static file">
        {hasStaticFile && (
          <FileDetails
            collectionSlug="media"
            doc={file}
            handleRemove={() => setHasStaticFile(false)}
            uploadConfig={uploadConfig}
          />
        )}
      </section>
      <section aria-label="Sortable file">
        <DraggableSortable ids={fileIDs} onDragEnd={() => {}}>
          {hasSortableFile && (
            <FileDetails
              collectionSlug="media"
              doc={file}
              hasMany
              isSortable
              removeItem={() => setHasSortableFile(false)}
              rowIndex={0}
              uploadConfig={uploadConfig}
            />
          )}
        </DraggableSortable>
      </section>
      <section aria-label="Collection reorder handle">
        <ListQueryProvider
          collectionSlug="media"
          data={undefined}
          orderableFieldName="_order"
          query={rowQuery}
        >
          <OrderableTable
            collection={getEntityConfig({ collectionSlug: 'media' })}
            columns={columns}
            data={rows}
          />
        </ListQueryProvider>
      </section>
      <section
        aria-label="Draggable preview toolbar"
        style={{ minHeight: 'calc(var(--spacer-6) * 2)', position: 'relative' }}
      >
        <LivePreviewToolbar {...props} draggable />
      </section>
      <section aria-label="Local file upload">
        <DocumentInfoProvider
          collectionSlug="media"
          currentEditor={user}
          hasPublishedDoc={false}
          initialData={emptyState}
          initialState={fileState}
          isLocked={false}
          lastUpdateTime={0}
          mostRecentVersionIsAutosaved={false}
          unpublishedVersionCount={0}
          versionCount={0}
        >
          <Form initialState={fileState}>
            <Upload collectionSlug="media" uploadConfig={uploadConfig} />
          </Form>
        </DocumentInfoProvider>
      </section>
    </div>
  )
}
