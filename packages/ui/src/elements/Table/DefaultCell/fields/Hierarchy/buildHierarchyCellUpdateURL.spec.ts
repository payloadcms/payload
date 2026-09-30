import { expect, test } from 'vitest'

import { buildHierarchyCellUpdateURL } from './buildHierarchyCellUpdateURL.js'

test('should include the active branch in hierarchy cell update URLs', () => {
  expect(
    buildHierarchyCellUpdateURL({
      apiRoute: '/api',
      branch: 'campaign',
      id: 42,
      collectionSlug: 'pages',
      serverURL: 'http://localhost:3000',
    }),
  ).toBe('http://localhost:3000/api/pages/42?branch=campaign')
})
