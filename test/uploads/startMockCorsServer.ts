import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const startMockCorsServer = () => {
  const server = http.createServer((req, res) => {
    const filePath = path.resolve(dirname, 'test-image.jpg')

    res.setHeader('Content-Type', 'image/jpeg')
    fs.createReadStream(filePath).pipe(res)
  })

  server.listen(4000, () => {
    console.log('Mock CORS server running on http://localhost:4000')
  })

  return server
}
