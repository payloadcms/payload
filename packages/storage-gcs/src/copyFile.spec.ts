import { expect, it, vi } from 'vitest'

import { copyGcsFile } from './copyFile.js'

it('should use an unused destination and verify copied bytes are readable', async () => {
  const destination = {
    exists: vi.fn().mockResolvedValue([false]),
    getMetadata: vi.fn().mockResolvedValue([{ size: '5' }]),
    makePublic: vi.fn().mockResolvedValue(undefined),
  }
  const source = {
    copy: vi.fn().mockResolvedValue([destination]),
    getMetadata: vi.fn().mockResolvedValue([{ size: '5' }]),
  }
  const client = {
    bucket: vi
      .fn()
      .mockReturnValue({ file: (key: string) => (key === 'source.png' ? source : destination) }),
  } as never

  await copyGcsFile({
    acl: 'Public',
    bucket: 'media',
    client,
    from: 'source.png',
    to: 'archive.png',
  })

  expect(source.copy).toHaveBeenCalledWith(destination, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  expect(destination.makePublic).toHaveBeenCalledOnce()
  expect(destination.getMetadata).toHaveBeenCalledOnce()
})
