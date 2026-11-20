import { expect, test } from 'vitest'

import { getTreeURL } from './getTreeURL.js'

test('should clear flat list queries while preserving scope, sort, columns and expanded branches', () => {
  const url = getTreeURL({
    currentURL:
      'http://localhost:3195/admin/collections/pages?search=Careers&where[title][equals]=Careers&groupBy=title&preset=2&queryByGroup[title][page]=2&page=3&sort=-title&limit=10&columns=title&tenant=west&treeExpanded=1',
  })
  const query = new URL(url).searchParams

  expect(new URL(url).pathname).toBe('/admin/collections/pages')
  expect([...query.keys()]).toEqual(['sort', 'limit', 'columns', 'tenant', 'treeExpanded'])
  expect(query.get('tenant')).toBe('west')
})
