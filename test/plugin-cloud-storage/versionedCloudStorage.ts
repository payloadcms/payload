import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

import path from 'node:path'

type StoredRepresentation = {
  _objectKey?: null | string
  filename?: null | string
  prefix?: null | string
}

type StoredUpload = {
  original?: null | StoredRepresentation
  variants?: null | Record<string, null | StoredRepresentation>
} & StoredRepresentation

export const getStoredCloudFiles = (doc: null | StoredUpload | undefined) => {
  if (!doc) {
    return []
  }
  const files: Array<{ key: string; roles: Array<{ sizeKey?: string; type: string }> }> = []
  const add = (
    representation: null | StoredRepresentation | undefined,
    role: { sizeKey?: string; type: string },
  ) => {
    if (!representation?.filename) {
      return
    }
    const key = path.posix.join(
      representation.prefix ?? '',
      representation._objectKey ?? '',
      representation.filename,
    )
    const existing = files.find((file) => file.key === key)
    if (existing) {
      existing.roles.push(role)
    } else {
      files.push({ key, roles: [role] })
    }
  }
  add(doc.original, { type: 'original' })
  add(doc, { type: 'default' })
  for (const [sizeKey, variant] of Object.entries(doc.variants ?? {})) {
    add(variant, { type: 'size', sizeKey })
  }
  return files
}

export const versionedCloudFiles = new Map<string, Buffer>()
export const versionedCloudFailure: {
  afterChange: boolean
  beforeCopy?: () => Promise<void>
  beforeUpload?: () => Promise<void>
  deleteKey?: string
  uploadNumber: number
} = { afterChange: false, uploadNumber: 0 }
export const versionedCloudCalls = {
  afterChanges: 0,
  deletes: [] as string[],
  moves: 0,
  uploads: 0,
}

export const versionedCloudAdapter: Adapter = () => ({
  name: 'test-cloud',
  copyFile: async ({ from, to }) => {
    await versionedCloudFailure.beforeCopy?.()
    const bytes = versionedCloudFiles.get(from)
    if (!bytes) {
      throw new Error('Cloud source does not exist')
    }
    if (versionedCloudFiles.has(to)) {
      throw Object.assign(new Error(`Storage destination already exists: ${to}`), {
        code: 'EEXIST',
      })
    }
    versionedCloudFiles.set(to, Buffer.from(bytes))
  },
  deleteFile: deleteStoredCloudFile,
  handleDelete: ({ doc, storageFilePath }) => {
    if (doc.id === undefined || !doc.filename) {
      throw new Error('Cloud document deletion requires a saved file document')
    }
    return deleteStoredCloudFile({ storageFilePath })
  },
  handleUpload: async ({ file, storageFilePath }) => {
    versionedCloudCalls.uploads += 1
    await versionedCloudFailure.beforeUpload?.()
    if (versionedCloudCalls.uploads === versionedCloudFailure.uploadNumber) {
      throw new Error('Cloud test upload failed')
    }
    const bytes = file.tempFilePath
      ? await (await import('node:fs/promises')).readFile(file.tempFilePath)
      : file.buffer
    versionedCloudFiles.set(storageFilePath, Buffer.from(bytes))
    return { storageMarker: storageFilePath } as never
  },
  moveFile: ({ from, to }) => {
    versionedCloudCalls.moves += 1
    const bytes = versionedCloudFiles.get(from)
    if (!bytes) {
      throw new Error('Cloud source does not exist')
    }
    if (versionedCloudFiles.has(to)) {
      throw Object.assign(new Error(`Storage destination already exists: ${to}`), {
        code: 'EEXIST',
      })
    }
    versionedCloudFiles.set(to, bytes)
    versionedCloudFiles.delete(from)
    return Promise.resolve()
  },
  staticHandler: (_req, { doc, params: { filename } }) => {
    const key = getStoredCloudFiles(doc as StoredUpload).find(
      (file) => path.posix.basename(file.key) === filename,
    )?.key
    const bytes = key ? versionedCloudFiles.get(key) : undefined

    return bytes ? new Response(new Uint8Array(bytes)) : new Response('Not found', { status: 404 })
  },
})

export const publicVersionedCloudAdapter: Adapter = (args) => ({
  ...versionedCloudAdapter(args),
  name: 'test-public-cloud',
  generateURL: ({ filename, prefix }) =>
    `https://files.example.test/${prefix ? `${prefix}/` : ''}${encodeURIComponent(filename)}`,
})

function deleteStoredCloudFile({ storageFilePath }: { storageFilePath: string }): Promise<void> {
  versionedCloudCalls.deletes.push(storageFilePath)
  if (versionedCloudFailure.deleteKey === storageFilePath) {
    throw new Error('Cloud test delete failed')
  }
  versionedCloudFiles.delete(storageFilePath)
  return Promise.resolve()
}
