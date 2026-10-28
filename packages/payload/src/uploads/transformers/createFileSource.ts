import type { FileSource } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'

/**
 * Creates a lazy `FileSource` from a web `File`, either in memory or backed by a temp file
 * through `openAsBlob`. No bytes are read until a method is called.
 */
export function createFileSource({ file }: { file: File }): FileSource {
  return {
    filename: file.name,
    mimeType: file.type,
    readFileBytes: async ({ numberOfBytes, signal, startByte }) => {
      const range = resolveByteRange({ numberOfBytes, sizeInBytes: file.size, startByte })
      signal?.throwIfAborted()

      const bytes = await file.slice(range.startByte, range.endByte).arrayBuffer()
      signal?.throwIfAborted()

      return new Uint8Array(bytes)
    },
    sizeInBytes: file.size,
    // Async so that a bad range rejects, like the other read, instead of throwing.
    // oxlint-disable-next-line typescript/require-await
    streamFile: async ({ numberOfBytes, signal, startByte = 0 } = {}) => {
      const range = resolveByteRange({ numberOfBytes, sizeInBytes: file.size, startByte })
      signal?.throwIfAborted()

      const stream = file.slice(range.startByte, range.endByte).stream()

      // Piping with a signal errors the stream and cancels the file read when it aborts.
      return signal ? stream.pipeThrough(new TransformStream(), { signal }) : stream
    },
  }
}

/** Checks a requested range against the file size. An omitted `numberOfBytes` means "to the end". */
function resolveByteRange({
  numberOfBytes,
  sizeInBytes,
  startByte,
}: {
  numberOfBytes?: number
  sizeInBytes: number
  startByte: number
}): { endByte: number; startByte: number } {
  if (!Number.isSafeInteger(startByte) || startByte < 0) {
    throw new TransformerContractError('startByte must be a non-negative integer.')
  }

  if (numberOfBytes !== undefined && (!Number.isSafeInteger(numberOfBytes) || numberOfBytes < 1)) {
    throw new TransformerContractError('numberOfBytes must be a positive integer.')
  }

  const endByte = numberOfBytes === undefined ? sizeInBytes : startByte + numberOfBytes

  if (startByte > sizeInBytes || endByte > sizeInBytes) {
    throw new TransformerContractError(
      `The byte range ${startByte}-${endByte} is outside the file size of ${sizeInBytes} bytes.`,
    )
  }

  return { endByte, startByte }
}
