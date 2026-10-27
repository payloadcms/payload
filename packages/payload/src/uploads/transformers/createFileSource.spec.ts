import { openAsBlob } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { createFileSource } from './createFileSource.js'

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes)

const readStream = async (stream: ReadableStream<Uint8Array>): Promise<string> =>
  decode(new Uint8Array(await new Response(stream).arrayBuffer()))

describe('createFileSource', () => {
  describe('from an in-memory file', () => {
    const createSource = () =>
      createFileSource({ file: new File(['abcdef'], 'image.png', { type: 'image/png' }) })

    it('should expose the file name, MIME type and size', () => {
      const source = createSource()

      expect(source.filename).toBe('image.png')
      expect(source.mimeType).toBe('image/png')
      expect(source.sizeInBytes).toBe(6)
    })

    it('should read a byte range', async () => {
      const source = createSource()

      const bytes = await source.readFileBytes({ numberOfBytes: 3, startByte: 2 })

      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(decode(bytes)).toBe('cde')
    })

    it('should stream the whole file when no range is given', async () => {
      const source = createSource()

      expect(await readStream(await source.streamFile())).toBe('abcdef')
    })

    it('should stream only the requested range', async () => {
      const source = createSource()

      expect(await readStream(await source.streamFile({ numberOfBytes: 2, startByte: 3 }))).toBe(
        'de',
      )
    })

    it('should stream from startByte to the end when numberOfBytes is omitted', async () => {
      const source = createSource()

      expect(await readStream(await source.streamFile({ startByte: 4 }))).toBe('ef')
    })

    it('should reject invalid byte ranges', async () => {
      const source = createSource()

      await expect(source.readFileBytes({ numberOfBytes: 1, startByte: -1 })).rejects.toThrow(
        TransformerContractError,
      )
      await expect(source.readFileBytes({ numberOfBytes: 1, startByte: 0.5 })).rejects.toThrow(
        TransformerContractError,
      )
      await expect(source.readFileBytes({ numberOfBytes: 0, startByte: 0 })).rejects.toThrow(
        TransformerContractError,
      )
      await expect(source.streamFile({ numberOfBytes: 0 })).rejects.toThrow(
        TransformerContractError,
      )
    })

    it('should reject a range that goes past the end of the file', async () => {
      const source = createSource()

      await expect(source.readFileBytes({ numberOfBytes: 2, startByte: 5 })).rejects.toThrow(
        TransformerContractError,
      )
      await expect(source.streamFile({ startByte: 7 })).rejects.toThrow(TransformerContractError)
    })

    it('should reject a read when the signal is already aborted', async () => {
      const source = createSource()
      const controller = new AbortController()
      controller.abort()

      await expect(
        source.readFileBytes({ numberOfBytes: 1, signal: controller.signal, startByte: 0 }),
      ).rejects.toThrow()
      await expect(source.streamFile({ signal: controller.signal })).rejects.toThrow()
    })

    it('should stop a stream when its signal is aborted', async () => {
      const source = createSource()
      const controller = new AbortController()

      const stream = await source.streamFile({ signal: controller.signal })
      controller.abort()

      await expect(readStream(stream)).rejects.toThrow()
    })
  })

  describe('from a temp file', () => {
    let directory: string
    let tempFilePath: string

    beforeEach(async () => {
      directory = await mkdtemp(path.join(os.tmpdir(), 'payload-file-source-'))
      tempFilePath = path.join(directory, 'upload')
      await writeFile(tempFilePath, 'abcdef')
    })

    afterEach(async () => {
      await rm(directory, { force: true, recursive: true })
    })

    it('should read a byte range and stream the file from disk', async () => {
      const blob = await openAsBlob(tempFilePath, { type: 'text/plain' })
      const source = createFileSource({ file: new File([blob], 'a.txt', { type: 'text/plain' }) })

      expect(source.sizeInBytes).toBe(6)
      expect(decode(await source.readFileBytes({ numberOfBytes: 2, startByte: 1 }))).toBe('bc')
      expect(await readStream(await source.streamFile())).toBe('abcdef')
    })
  })
})
