import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const versionedCloudFiles = new Map<string, Buffer>()
export const versionedCloudFailure: {
  afterChange: boolean
  beforeCopy?: () => Promise<void>
  beforeUpload?: () => Promise<void>
  deleteKey?: string
  moveNumber?: number
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
  handleDelete: ({ storageFilePath }) => {
    versionedCloudCalls.deletes.push(storageFilePath)
    if (versionedCloudFailure.deleteKey === storageFilePath) {
      throw new Error('Cloud test delete failed')
    }
    versionedCloudFiles.delete(storageFilePath)
    return Promise.resolve()
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
    if (versionedCloudCalls.moves === versionedCloudFailure.moveNumber) {
      throw new Error('Cloud test move failed')
    }
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
    const manifest = (doc as { _managedFiles?: Array<{ key: string }> } | undefined)?._managedFiles
    const key = manifest?.find((file) => file.key.split('/').at(-1) === filename)?.key
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
