import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { unstable_dev } from 'wrangler'

let directory: string | undefined
let worker: Awaited<ReturnType<typeof unstable_dev>> | undefined

afterEach(async () => {
  try {
    await worker?.stop()
  } finally {
    if (directory) {
      await rm(directory, { force: true, recursive: true })
    }
    vi.unstubAllEnvs()
  }
})

it('should log structured records inside the Workers runtime without Node compatibility', async () => {
  vi.stubEnv('WRANGLER_SEND_METRICS', 'false')
  directory = await mkdtemp(path.join(tmpdir(), 'payload-cloudflare-logger-'))
  const script = path.join(directory, 'worker.ts')
  const loggerPath = path.resolve(import.meta.dirname, '../src/logger.ts')

  await writeFile(
    script,
    `import { createCloudflareLogger } from ${JSON.stringify(loggerPath)}
    export default {
      fetch() {
        const records = []
        console.info = (record) => records.push(JSON.parse(record))
        console.error = (record) => records.push(JSON.parse(record))
        const logger = createCloudflareLogger({}).child({ collection: 'media' })
        logger.debug('hidden')
        logger.info('uploaded')
        logger.error({ err: new Error('upload failed'), msg: 'Unable to upload' })
        return Response.json(records)
      }
    }`,
  )

  worker = await unstable_dev(script, {
    compatibilityDate: '2025-08-15',
    compatibilityFlags: [],
    local: true,
    logLevel: 'none',
    port: 0,
    inspectorPort: 0,
    experimental: { disableDevRegistry: true, disableExperimentalWarning: true, watch: false },
  })
  const response = await worker.fetch()

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual([
    expect.objectContaining({ collection: 'media', level: 30, msg: 'uploaded' }),
    expect.objectContaining({
      collection: 'media',
      err: expect.objectContaining({ msg: 'upload failed', stack: expect.any(String) }),
      level: 50,
      msg: 'Unable to upload',
    }),
  ])
}, 30000)
