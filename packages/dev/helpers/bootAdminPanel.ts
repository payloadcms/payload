const { createServer } = require('http')
const next = require('next')
const { parse } = require('url')

const bootAdminPanel = async ({ port = 3000, appDir }) => {
  const serverURL = `http://localhost:${port}`
  const app = next({
    dev: true,
    hostname: 'localhost',
    port: port || 3000,
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

module.exports = { bootAdminPanel }
