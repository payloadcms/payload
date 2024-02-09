import fs from 'fs'
import path from 'path'
import fsPromises from 'fs/promises'

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

export const GET = async ({ request }: { request: Request }) => {
  const filePath = path.resolve('media/A4 - 2.pdf')
  const stats = await fsPromises.stat(filePath)
  const data = streamFile(filePath)
  return new Response(data, {
    status: 200,
    headers: new Headers({
      'content-length': stats.size + '',
    }),
  })
}
