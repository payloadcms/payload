import { expect, test } from 'tstyche'

import type { FileVersionedMedia } from './payload-types.js'

type Original = NonNullable<FileVersionedMedia['original']>
type ManagedFiles = NonNullable<FileVersionedMedia['_managedFiles']>
type ManagedRole = ManagedFiles[number]['roles'][number]

test('should generate original source fields on uploads', () => {
  expect<Original>().type.toBeAssignableTo<{
    filename?: null | string
    filesize?: null | number
    height?: null | number
    mimeType?: null | string
    url?: null | string
    width?: null | number
  }>()
})

test('should generate the manifest identity and size role', () => {
  expect<ManagedFiles[number]>().type.toBeAssignableTo<{
    key: string
    roles: ManagedRole[]
    storageBackendId: string
  }>()
  expect<{ sizeKey: string; type: 'size' }>().type.toBeAssignableTo<ManagedRole>()
  expect<{ type: 'size' }>().type.not.toBeAssignableTo<ManagedRole>()
})
