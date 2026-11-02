import type { Sharp } from 'sharp'

import { setUploadFilePath } from 'payload/internal'
import { describe, expect, it, vi } from 'vitest'

import type { SharpDependency } from './types.js'

import { createSharpFromFile } from './createSharpFromFile.js'

describe('createSharpFromFile', () => {
  it('passes a disk-backed File path directly to Sharp', async () => {
    const file = new File([], 'photo.png', { type: 'image/png' })
    const arrayBuffer = vi.spyOn(file, 'arrayBuffer')
    const stream = vi.spyOn(file, 'stream')
    const sharpFile = {} as Sharp
    const sharpDependency = vi.fn<SharpDependency>(() => sharpFile)
    setUploadFilePath(file, '/tmp/payload-upload.png')

    await expect(
      createSharpFromFile({ file, options: { animated: true }, sharpDependency }),
    ).resolves.toBe(sharpFile)
    expect(sharpDependency).toHaveBeenCalledWith('/tmp/payload-upload.png', { animated: true })
    expect(arrayBuffer).not.toHaveBeenCalled()
    expect(stream).not.toHaveBeenCalled()
  })

  it('should read an in-memory File once across concurrent calls', async () => {
    const file = new File(['image-bytes'], 'photo.png', { type: 'image/png' })
    const arrayBuffer = vi.spyOn(file, 'arrayBuffer')
    const sharpDependency = vi.fn<SharpDependency>(() => ({}) as Sharp)

    await Promise.all(
      Array.from({ length: 4 }, () => createSharpFromFile({ file, sharpDependency })),
    )

    expect(arrayBuffer).toHaveBeenCalledTimes(1)
    expect(sharpDependency).toHaveBeenCalledTimes(4)

    const inputs = sharpDependency.mock.calls.map(([input]) => input)

    expect(inputs.every((input) => input === inputs[0])).toBe(true)
  })

  it('should read an in-memory File once across sequential calls', async () => {
    const file = new File(['image-bytes'], 'photo.png', { type: 'image/png' })
    const arrayBuffer = vi.spyOn(file, 'arrayBuffer')
    const sharpDependency = vi.fn<SharpDependency>(() => ({}) as Sharp)

    await createSharpFromFile({ file, sharpDependency })
    await createSharpFromFile({ file, options: { animated: true }, sharpDependency })

    expect(arrayBuffer).toHaveBeenCalledTimes(1)
    expect(sharpDependency.mock.calls[0]![0]).toBe(sharpDependency.mock.calls[1]![0])
    expect(sharpDependency.mock.calls[1]![1]).toEqual({ animated: true })
  })

  it('should cache different File objects separately', async () => {
    const firstFile = new File(['first'], 'first.png', { type: 'image/png' })
    const secondFile = new File(['second'], 'second.png', { type: 'image/png' })
    const firstArrayBuffer = vi.spyOn(firstFile, 'arrayBuffer')
    const secondArrayBuffer = vi.spyOn(secondFile, 'arrayBuffer')
    const sharpDependency = vi.fn<SharpDependency>(() => ({}) as Sharp)

    await createSharpFromFile({ file: firstFile, sharpDependency })
    await createSharpFromFile({ file: secondFile, sharpDependency })

    expect(firstArrayBuffer).toHaveBeenCalledTimes(1)
    expect(secondArrayBuffer).toHaveBeenCalledTimes(1)
    expect(String(sharpDependency.mock.calls[0]![0])).toBe('first')
    expect(String(sharpDependency.mock.calls[1]![0])).toBe('second')
  })

  it('should retry reading a File after a rejected read', async () => {
    const file = new File(['image-bytes'], 'photo.png', { type: 'image/png' })
    const readError = new Error('read failed')
    const arrayBuffer = vi.spyOn(file, 'arrayBuffer').mockRejectedValueOnce(readError)
    const sharpDependency = vi.fn<SharpDependency>(() => ({}) as Sharp)

    await expect(createSharpFromFile({ file, sharpDependency })).rejects.toBe(readError)
    await createSharpFromFile({ file, sharpDependency })

    expect(arrayBuffer).toHaveBeenCalledTimes(2)
    expect(String(sharpDependency.mock.calls[0]![0])).toBe('image-bytes')
  })
})
