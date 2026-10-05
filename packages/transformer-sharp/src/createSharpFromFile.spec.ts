import type { Sharp } from 'sharp'

import { setUploadFilePath } from 'payload/internal'
import { describe, expect, it, vi } from 'vitest'

import type { SharpDependency } from './types.js'

import { createSharpFromFile } from './createSharpFromFile.js'

describe('createSharpFromFile', () => {
  it('passes a disk-backed File path directly to Sharp', async () => {
    const file = new File([], 'photo.png', { type: 'image/png' })
    const stream = vi.spyOn(file, 'stream')
    const sharpFile = {} as Sharp
    const sharpDependency = vi.fn<SharpDependency>(() => sharpFile)
    setUploadFilePath(file, '/tmp/payload-upload.png')

    await expect(
      createSharpFromFile({ file, options: { animated: true }, sharpDependency }),
    ).resolves.toBe(sharpFile)
    expect(sharpDependency).toHaveBeenCalledWith('/tmp/payload-upload.png', { animated: true })
    expect(stream).not.toHaveBeenCalled()
  })
})
