import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

import { withFileTransformAccessContext } from './withFileTransformAccessContext.js'

const makeReq = (): PayloadRequest => ({}) as unknown as PayloadRequest

describe('withFileTransformAccessContext', () => {
  it('should set req.fileTransform to true only while run() is executing', async () => {
    const req = makeReq()
    let observedDuringRun: true | undefined

    await withFileTransformAccessContext({
      isTransform: true,
      req,
      run: () => {
        observedDuringRun = req.fileTransform
      },
    })

    expect(observedDuringRun).toBe(true)
    expect(req.fileTransform).toBeUndefined()
  })

  it('should restore the previous value when run() throws synchronously', async () => {
    const req = makeReq()

    await expect(
      withFileTransformAccessContext({
        isTransform: true,
        req,
        run: () => {
          throw new Error('denied')
        },
      }),
    ).rejects.toThrow('denied')

    expect(req.fileTransform).toBeUndefined()
  })

  it('should restore the previous value when run() rejects asynchronously', async () => {
    const req = makeReq()

    await expect(
      withFileTransformAccessContext({
        isTransform: true,
        req,
        run: async () => {
          throw new Error('denied')
        },
      }),
    ).rejects.toThrow('denied')

    expect(req.fileTransform).toBeUndefined()
  })

  it('should never set req.fileTransform when isTransform is false', async () => {
    const req = makeReq()
    let observedDuringRun: true | undefined

    await withFileTransformAccessContext({
      isTransform: false,
      req,
      run: () => {
        observedDuringRun = req.fileTransform
      },
    })

    expect(observedDuringRun).toBeUndefined()
  })

  it("should return run()'s resolved value", async () => {
    const req = makeReq()

    const result = await withFileTransformAccessContext({
      isTransform: true,
      req,
      run: async () => 'access-granted',
    })

    expect(result).toBe('access-granted')
  })

  it('should restore a pre-existing truthy value after completion rather than hardcoding undefined', async () => {
    const req = makeReq()
    req.fileTransform = true

    await withFileTransformAccessContext({
      isTransform: true,
      req,
      run: async () => undefined,
    })

    expect(req.fileTransform).toBe(true)
  })
})
