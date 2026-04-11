import fs from 'fs'

export function iteratorToStream(iterator: AsyncIterator<Uint8Array>) {
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await iterator.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}

export async function* nodeStreamToIterator(stream: fs.ReadStream) {
  for await (const chunk of stream) {
    yield new Uint8Array(chunk)
  }
}

export function streamFile({
  filePath,
  options,
}: {
  filePath: string
  options?: { end?: number; start?: number }
}): ReadableStream {
  const nodeStream = fs.createReadStream(filePath, options)
  const data: ReadableStream = iteratorToStream(nodeStreamToIterator(nodeStream))
  return data
}
