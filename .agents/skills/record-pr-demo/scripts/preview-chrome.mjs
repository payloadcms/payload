#!/usr/bin/env node
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** Serves only the known preview assets on loopback; no app or video encoder is required. */
export async function startChromePreview({ port = 4400 } = {}) {
  const assets = new Map([
    ['/', ['preview/index.html', 'text/html']],
    ['/preview/index.mjs', ['preview/index.mjs', 'text/javascript']],
    ['/preview/application.html', ['preview/application.html', 'text/html']],
    ['/accessibility-demo.mjs', ['accessibility-demo.mjs', 'text/javascript']],
    [
      '/preview/accessibility-application.html',
      ['preview/accessibility-application.html', 'text/html'],
    ],
    ['/WindowChrome/index.mjs', ['WindowChrome/index.mjs', 'text/javascript']],
  ])
  const server = createServer(async (request, response) => {
    const asset = assets.get(new URL(request.url, 'http://localhost').pathname)
    if (!asset) {
      response.writeHead(404).end('Not found')
      return
    }
    try {
      const content = await readFile(new URL(asset[0], import.meta.url))
      response
        .writeHead(200, {
          'Content-Type': `${asset[1]}; charset=utf-8`,
          'Cache-Control': 'no-store',
        })
        .end(content)
    } catch {
      response.writeHead(500).end('Could not read preview asset')
    }
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  return { server, url: `http://127.0.0.1:${server.address().port}` }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  if (
    args.length &&
    (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1]) || Number(args[1]) > 65535)
  ) {
    throw new Error('Usage: preview-chrome.mjs [--port 4400]')
  }
  const { server, url } = await startChromePreview({ port: args.length ? Number(args[1]) : 4400 })
  console.log(
    `Chrome preview: ${url}\nEdits appear on reload; no recording or conversion required.`,
  )
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close())
}
