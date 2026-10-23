import type { Payload, PayloadComponent } from 'payload'
import type React from 'react'

import { expect, test } from 'vitest'

import { FolderIcon } from '../../../icons/Folder/index.js'
import { HierarchyButton } from './index.server.js'

function renderHierarchyButton({
  Icon,
  SmallIcon = Icon,
}: {
  Icon: PayloadComponent
  SmallIcon?: PayloadComponent
}) {
  const payload = {
    config: {
      collections: [
        {
          slug: 'folders',
          hierarchy: { admin: { components: { Icon, SmallIcon } } },
        },
      ],
    },
    importMap: {},
  } as unknown as Payload

  return HierarchyButton({
    fieldName: 'folder',
    hierarchyCollectionSlug: 'folders',
    payload,
  }) as React.ReactElement<{
    Icon: React.ReactElement<{ className?: string; size?: number }>
    SmallIcon: React.ReactElement<{ className?: string; size?: number }>
  }>
}

test('should render the default folder icon without the import map when given as a string', () => {
  const button = renderHierarchyButton({ Icon: '@payloadcms/ui#FolderIcon' })

  expect(button.props.Icon.type).toBe(FolderIcon)
  expect(button.props.Icon.props.size).toBe(16)
  expect(button.props.SmallIcon.type).toBe(FolderIcon)
})

test('should render the default folder icon without the import map when given as an object', () => {
  const button = renderHierarchyButton({
    Icon: { clientProps: { color: 'muted' }, path: '@payloadcms/ui#FolderIcon' },
  })

  // Same size as when it was rendered through the import map
  expect(button.props.Icon.type).toBe(FolderIcon)
  expect(button.props.Icon.props.size).toBeUndefined()
  expect(button.props.SmallIcon.type).toBe(FolderIcon)
})

test('should pass the className from clientProps to the default folder icon', () => {
  const button = renderHierarchyButton({
    Icon: { clientProps: { className: 'muted' }, path: '@payloadcms/ui#FolderIcon' },
  })

  expect(button.props.Icon.props.className).toBe('muted')
  expect(button.props.SmallIcon.props.className).toBe('muted')
})

test('should pass the size from clientProps to the default folder icon', () => {
  const button = renderHierarchyButton({
    Icon: { clientProps: { size: 16 }, path: '@payloadcms/ui#FolderIcon' },
  })

  expect(button.props.Icon.props.size).toBe(16)
})

test('should render a default small icon given separately from the icon', () => {
  const button = renderHierarchyButton({
    Icon: '@payloadcms/ui#FolderIcon',
    SmallIcon: { clientProps: { className: 'small' }, path: '@payloadcms/ui#FolderIcon' },
  })

  expect(button.props.SmallIcon.type).toBe(FolderIcon)
  expect(button.props.SmallIcon.props.className).toBe('small')
})
