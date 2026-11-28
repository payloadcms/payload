import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const getRelationships = vi.fn()
// A requested document sits at null until the provider answers.
let loadedDocs: Record<string, unknown> = {}

// The cell reads these through providers that need a whole admin tree; the
// question here is only whether it asks for its documents.
vi.mock('../../../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: { admin: { dateFormat: 'MMMM do yyyy, h:mm a' }, collections: [] },
    getEntityConfig: () => ({ admin: { useAsTitle: 'id' }, slug: 'organizations' }),
  }),
}))

vi.mock('../../../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => key,
  }),
}))

vi.mock('../../../RelationshipProvider/index.js', () => ({
  useListRelationships: () => ({ documents: { organizations: loadedDocs }, getRelationships }),
}))

// An IntersectionObserver entry is undefined until the cell first crosses the
// viewport, which is the state a row past the fold is in.
vi.mock('../../../../../hooks/useIntersect.js', () => ({
  useIntersect: () => [vi.fn(), undefined, undefined],
}))

import { getTranslation } from '@payloadcms/translations'

vi.mock('@payloadcms/translations', () => ({
  getTranslation: (label: string) => label,
}))

import React from 'react'

import { RelationshipCell } from './index.js'

const field = {
  name: 'organization',
  label: 'Organization',
  relationTo: 'organizations',
  type: 'relationship',
} as never

test('a cell outside the viewport still asks for its documents', async () => {
  getRelationships.mockClear()
  loadedDocs = {}

  await render(<RelationshipCell cellData={42} field={field} rowData={{}} />)

  expect(getRelationships).toHaveBeenCalled()
  expect(getRelationships).toHaveBeenCalledWith([{ relationTo: 'organizations', value: 42 }])
})

test('and reads as loading until the document arrives, not as empty', async () => {
  getRelationships.mockClear()
  loadedDocs = { 42: null }

  const screen = await render(<RelationshipCell cellData={42} field={field} rowData={{}} />)

  // `<No Organization>` would mean the cell claimed the row has no value.
  await expect.element(screen.getByText('general:loading...')).toBeInTheDocument()
})

test('a cell with no value stays empty', async () => {
  getRelationships.mockClear()
  loadedDocs = {}

  const screen = await render(<RelationshipCell cellData={null} field={field} rowData={{}} />)

  expect(getRelationships).not.toHaveBeenCalled()
  await expect.element(screen.getByText('general:noLabel')).toBeInTheDocument()
})
