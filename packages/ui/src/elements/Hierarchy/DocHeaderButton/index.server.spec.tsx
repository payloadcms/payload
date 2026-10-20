import type { Payload, PayloadComponent } from 'payload'
import type React from 'react'

import { expect, test } from 'vitest'

import { FolderIcon } from '../../../icons/Folder/index.js'
import { HierarchyButton } from './index.server.js'

function renderHierarchyButton({ Icon }: { Icon: PayloadComponent }) {
  const payload = {
    config: {
      collections: [
        {
          slug: 'folders',
          hierarchy: { admin: { components: { Icon, SmallIcon: Icon } } },
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
    Icon: React.ReactElement<{ className?: string }>
    SmallIcon: React.ReactElement<{ className?: string }>
  }>
}

test('should render the default folder icon without the import map when given as a string', () => {
  const button = renderHierarchyButton({ Icon: '@payloadcms/ui#FolderIcon' })

  expect(button.props.Icon.type).toBe(FolderIcon)
  expect(button.props.SmallIcon.type).toBe(FolderIcon)
})

test('should render the default folder icon without the import map when given as an object', () => {
  const button = renderHierarchyButton({
    Icon: { clientProps: { color: 'muted' }, path: '@payloadcms/ui#FolderIcon' },
  })

  expect(button.props.Icon.type).toBe(FolderIcon)
  expect(button.props.SmallIcon.type).toBe(FolderIcon)
})

test('should pass the className from clientProps to the default folder icon', () => {
  const button = renderHierarchyButton({
    Icon: { clientProps: { className: 'muted' }, path: '@payloadcms/ui#FolderIcon' },
  })

  expect(button.props.Icon.props.className).toBe('muted')
  expect(button.props.SmallIcon.props.className).toBe('muted')
})
