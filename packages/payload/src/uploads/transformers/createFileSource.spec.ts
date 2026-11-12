import { describe, expect, it } from 'vitest'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { createFileSource } from './createFileSource.js'

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes)

const readStream = async (stream: ReadableStream<Uint8Array>): Promise<string> =>
  decode(new Uint8Array(await new Response(stream).arrayBuffer()))

const createSource = () =>
  createFileSource({ file: new File(['abcdef'], 'image.png', { type: 'image/png' }) })

describe('createFileSource', () => {
  it.for([
    { name: 'a byte range', range: { numberOfBytes: 3, startByte: 2 }, expected: 'cde' },
    {
      name: 'only the bytes up to the end when a range runs past it',
      range: { numberOfBytes: 1024, startByte: 4 },
      expected: 'ef',
    },
  ])('should read $name', async ({ expected, range }) => {
    expect(decode(await createSource().readFileBytes(range))).toBe(expected)
  })

  it.for([
    { name: 'the whole file when no range is given', range: undefined, expected: 'abcdef' },
    {
      name: 'from startByte to the end when numberOfBytes is omitted',
      range: { startByte: 4 },
      expected: 'ef',
    },
  ])('should stream $name', async ({ expected, range }) => {
    expect(await readStream(await createSource().streamFile(range))).toBe(expected)
  })

  it.for([
    { name: 'a negative startByte', read: { numberOfBytes: 1, startByte: -1 } },
    { name: 'a zero numberOfBytes', read: { numberOfBytes: 0, startByte: 0 } },
    { name: 'a read start past the end of the file', read: { numberOfBytes: 1, startByte: 7 } },
    { name: 'a stream start past the end of the file', stream: { startByte: 7 } },
  ])('should reject $name', async ({ read, stream }) => {
    const source = createSource()

    await expect(read ? source.readFileBytes(read) : source.streamFile(stream)).rejects.toThrow(
      TransformerContractError,
    )
  })

  it('should reject a read when the signal is already aborted', async () => {
    await expect(
      createSource().readFileBytes({ numberOfBytes: 1, signal: AbortSignal.abort(), startByte: 0 }),
    ).rejects.toThrow()
  })

  it('should stop a stream when its signal is aborted', async () => {
    const controller = new AbortController()

    const stream = await createSource().streamFile({ signal: controller.signal })
    controller.abort()

    await expect(readStream(stream)).rejects.toThrow()
  })
})
