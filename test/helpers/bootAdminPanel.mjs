import { createServer } from 'http'
import next from 'next'
import { parse } from 'url'

const actualNext = next.default || next
export const bootAdminPanel = async ({ port = 3000, appDir }) => {
  const serverURL = `http://localhost:${port}`
  const app = actualNext({
    dev: true,
    hostname: 'localhost',
    port,
    dir: appDir,
  })

  const handle = app.getRequestHandler()
  await app.prepare()

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on ${serverURL}`)
    })
}
