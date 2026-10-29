import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCloudflareLogger } from './logger.js'

const readRecord = ({ spy }: { spy: ReturnType<typeof vi.spyOn> }) =>
  JSON.parse(spy.mock.calls[0]![0] as string)

describe('Cloudflare logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should filter messages below the configured level', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logger = createCloudflareLogger({ level: 'warn' })

    logger.info('hidden')
    logger.warn('visible')

    expect(info).not.toHaveBeenCalled()
    expect(readRecord({ spy: warn })).toMatchObject({ level: 40, msg: 'visible' })
  })

  it('should serialize errors with their message and stack', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = createCloudflareLogger({})

    logger.error({ err: new Error('upload failed'), msg: 'Unable to upload' })

    expect(readRecord({ spy: error })).toMatchObject({
      err: { msg: 'upload failed', stack: expect.stringContaining('Error: upload failed') },
      level: 50,
      msg: 'Unable to upload',
    })
  })

  it('should include child logger bindings', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = createCloudflareLogger({}).child({ collection: 'media' })

    logger.info('uploaded')

    expect(readRecord({ spy: info })).toMatchObject({ collection: 'media', msg: 'uploaded' })
  })

  it('should suppress output when disabled', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = createCloudflareLogger({ enabled: false })

    logger.error('hidden')

    expect(error).not.toHaveBeenCalled()
  })
})
