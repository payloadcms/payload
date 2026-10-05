import type { FileSource } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'

/** Creates a lazy, repeatable source without buffering stored or temporary files. */
export function createFileSource(
  args:
    | { file: File }
    | {
        filename: string
        mimeType: string
        retrieve: () => Promise<Response>
        size?: number
      },
): FileSource {
  const file = 'file' in args ? args.file : undefined
  const filename = file ? file.name : 'filename' in args ? args.filename : ''
  const mimeType = file ? file.type : 'mimeType' in args ? args.mimeType : ''
  const size = file ? file.size : 'size' in args ? args.size : undefined
  const stream = async (): Promise<ReadableStream<Uint8Array>> => {
    if (file) {
      return file.stream()
    }

    if (!('retrieve' in args)) {
      throw new TransformerContractError(`Unable to retrieve source ${filename}.`)
    }

    const response = await args.retrieve()

    if (!response.ok || !response.body) {
      await response.body?.cancel()
      throw new TransformerContractError(`Unable to retrieve source ${filename}.`)
    }

    return response.body
  }

  return {
    arrayBuffer: async ({ maxBytes }) => {
      assertBound({ value: maxBytes })

      if (size !== undefined && size > maxBytes) {
        throw new TransformerContractError('File source exceeds the whole-file byte limit.')
      }

      return consume({ isWholeFile: true, limit: maxBytes, stream: await stream() })
    },
    filename,
    mimeType,
    read: async ({ length, offset = 0 }) => {
      assertBound({ value: length })
      assertBound({ value: offset })
      assertBound({ value: offset + length })

      if (file) {
        return file.slice(offset, offset + length).arrayBuffer()
      }

      if (length === 0) {
        return new ArrayBuffer(0)
      }

      return consume({ isWholeFile: false, limit: length, offset, stream: await stream() })
    },
    size,
    stream,
  }
}

function assertBound({ value }: { value: number }): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TransformerContractError(
      'File source byte bounds must be non-negative safe integers.',
    )
  }
}

async function consume({
  isWholeFile,
  limit,
  offset = 0,
  stream,
}: {
  isWholeFile: boolean
  limit: number
  offset?: number
  stream: ReadableStream<Uint8Array>
}): Promise<ArrayBuffer> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let skipped = 0
  let length = 0
  let hasFinished = false

  try {
    while (true) {
      const result = await reader.read()

      if (result.done) {
        hasFinished = true
        break
      }

      const start = Math.min(result.value.byteLength, offset - skipped)

      skipped += start
      const available = result.value.byteLength - start

      if (isWholeFile && length + available > limit) {
        throw new TransformerContractError('File source exceeds the whole-file byte limit.')
      }

      const count = Math.min(available, limit - length)

      if (count > 0) {
        chunks.push(result.value.slice(start, start + count))
        length += count
      }

      if (!isWholeFile && length === limit) {
        break
      }
    }

    const output = new Uint8Array(length)
    let index = 0

    for (const chunk of chunks) {
      output.set(chunk, index)
      index += chunk.byteLength
    }

    return output.buffer
  } finally {
    try {
      if (!hasFinished) {
        await reader.cancel()
      }
    } finally {
      reader.releaseLock()
    }
  }
}
