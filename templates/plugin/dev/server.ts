import { createServer } from 'http'
import next from 'next'
import open from 'open'
import path from 'path'
import { fileURLToPath, parse } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const app = next({ dev: true, dir: dirname })
const handle = app.getRequestHandler()

await app.prepare()

// Open the admin if the -o flag is passed
await open(`http://localhost:3000/admin`)

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true)
  void handle(req, res, parsedUrl)
})

server.listen(3000, () => {
  void fetch(`http://localhost:3000/admin`)
  void fetch(`http://localhost:3000/api/access`)
})
