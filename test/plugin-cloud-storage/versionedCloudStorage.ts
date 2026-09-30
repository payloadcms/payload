import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const versionedCloudFiles = new Map<string, Buffer>()
export const versionedCloudFailure: {
  afterChange: boolean
  beforeUpload?: () => Promise<void>
  uploadNumber: number
} = { afterChange: false, uploadNumber: 0 }
export const versionedCloudCalls = { afterChanges: 0, deletes: [] as string[], uploads: 0 }

export const versionedCloudAdapter: Adapter = () => ({
  name: 'test-cloud',
  copyFile: ({ from, to }) => {
    const bytes = versionedCloudFiles.get(from)
    if (!bytes || versionedCloudFiles.has(to)) {
      throw new Error('Cannot copy test cloud object')
    }
    versionedCloudFiles.set(to, Buffer.from(bytes))
    return Promise.resolve()
  },
  handleDelete: ({ storageFilePath }) => {
    versionedCloudCalls.deletes.push(storageFilePath)
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
