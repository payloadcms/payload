import { expect, it } from 'vitest'

import { getIncomingFiles } from './getIncomingFiles.js'

it('should mark generated client sizes processed while leaving the original unchanged', () => {
  const clientUpload = { isProcessed: false, originalStorageFilePath: 'issued-key/image.png' }
  const files = getIncomingFiles({
    data: {
      filename: 'image.png',
      mimeType: 'image/png',
      sizes: {
        square: { filename: 'same.png', mimeType: 'image/png' },
        thumbnail: { filename: 'same.png', mimeType: 'image/png' },
      },
    },
    req: {
      file: { clientUpload, data: Buffer.alloc(0), size: 100 },
      payloadUploadSizes: { square: Buffer.from('square'), thumbnail: Buffer.from('thumb') },
    },
  } as never)

  expect(files.map(({ clientUpload: state, sizeName }) => ({ state, sizeName }))).toEqual([
    { state: clientUpload, sizeName: undefined },
    { state: { ...clientUpload, isProcessed: true }, sizeName: 'square' },
    { state: { ...clientUpload, isProcessed: true }, sizeName: 'thumbnail' },
  ])
  expect(clientUpload.isProcessed).toBe(false)
})

it('should leave server files without provider client state', () => {
  const files = getIncomingFiles({
    data: { filename: 'server.png', mimeType: 'image/png' },
    req: { file: { data: Buffer.from('server'), size: 6 } },
  } as never)

  expect(files[0].clientUpload).toBeUndefined()
})
