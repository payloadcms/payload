import type { AddressInfo } from 'net'

import { createServer } from 'http'

export type TestFileServer = {
  close: () => Promise<void>
  url: string
}

export async function startTestFileServer({
  contentType,
  data,
  hostname = '127.0.0.1',
  port = 0,
}: {
  contentType: string
  data: Buffer
  hostname?: string
  port?: number
}): Promise<TestFileServer> {
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      'Content-Length': data.length,
      'Content-Type': contentType,
    })
    response.end(data)
  })

  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error): void => reject(error)

    server.once('error', handleError)
    server.listen(port, hostname, () => {
      server.off('error', handleError)
      resolve()
    })
  })

  const address = server.address() as AddressInfo

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
        server.closeAllConnections()
      }),
    url: `http://${hostname}:${address.port}`,
  }
}
