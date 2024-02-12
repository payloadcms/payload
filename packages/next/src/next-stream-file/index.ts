import fs from 'fs'

function iteratorToStream(iterator) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}

async function* nodeStreamToIterator(stream: fs.ReadStream) {
  for await (const chunk of stream) {
    yield new Uint8Array(chunk)
  }
}

export function streamFile(path: string): ReadableStream {
  const nodeStream = fs.createReadStream(path)
  const data: ReadableStream = iteratorToStream(nodeStreamToIterator(nodeStream))
  return data
}
