import { describe, expect, it } from 'vitest'

import { getCollectionPreviewLayout, getCollectionPreviewPreferenceKey } from './preferences.js'

describe('preview display preferences', () => {
  it('should keep separate layouts for widgets previewing the same collection', () => {
    const firstKey = getCollectionPreviewPreferenceKey({
      collectionSlug: 'pages',
      widgetId: 'collection-preview-first',
    })
    const secondKey = getCollectionPreviewPreferenceKey({
      collectionSlug: 'pages',
      widgetId: 'collection-preview-second',
    })

    expect(firstKey).not.toBe(secondKey)
  })

  it('should retain the widget layout when its collection changes', () => {
    expect(
      getCollectionPreviewPreferenceKey({
        collectionSlug: 'pages',
        widgetId: 'collection-preview-first',
      }),
    ).toBe(
      getCollectionPreviewPreferenceKey({
        collectionSlug: 'media',
        widgetId: 'collection-preview-first',
      }),
    )
  })

  it('should keep dashboard preferences separate for each collection and from list views', () => {
    expect(getCollectionPreviewPreferenceKey({ collectionSlug: 'users' })).toBe(
      'dashboard-collection-layout-users',
    )
    expect(getCollectionPreviewPreferenceKey({ collectionSlug: 'media' })).toBe(
      'dashboard-collection-layout-media',
    )
  })

  it.each([
    { value: { documentLayout: 'table' }, expected: 'table' },
    { value: { documentLayout: 'grid' }, expected: 'grid' },
    { value: { documentLayout: 'invalid' }, expected: 'grid' },
    { value: {}, expected: 'grid' },
    { value: null, expected: 'grid' },
    { value: undefined, expected: 'grid' },
  ])('should restore a supported display option %j', ({ value, expected }) => {
    expect(getCollectionPreviewLayout({ value })).toBe(expected)
  })
})
