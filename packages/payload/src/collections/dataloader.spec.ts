import { describe, expect, it } from 'vitest'

import { getDataLoader } from './dataloader.js'

const createDeferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })

  return { promise, resolve }
}

describe('getDataLoader', () => {
  it('should serialize find calls while a transaction is active', async () => {
    const calls: string[] = []
    const firstStarted = createDeferred()
    const releaseFirst = createDeferred()
    let activeFinds = 0
    let maxActiveFinds = 0

    const req = {
      transactionID: 'transaction-id',
      payload: {
        find: async (args: { where: { id: { equals: string } } }) => {
          const id = args.where.id.equals

          calls.push(`start:${id}`)
          activeFinds += 1
          maxActiveFinds = Math.max(maxActiveFinds, activeFinds)

          if (id === 'first') {
            firstStarted.resolve()
            await releaseFirst.promise
          }

          calls.push(`finish:${id}`)
          activeFinds -= 1

          return { docs: [] }
        },
      },
    }

    const dataLoader = getDataLoader(req as never)
    const firstFind = dataLoader.find({
      collection: 'items',
      req,
      where: { id: { equals: 'first' } },
    } as never)

    await firstStarted.promise

    const secondFind = dataLoader.find({
      collection: 'items',
      req,
      where: { id: { equals: 'second' } },
    } as never)

    await Promise.resolve()

    expect(maxActiveFinds).toBe(1)

    releaseFirst.resolve()
    await Promise.all([firstFind, secondFind])

    expect(calls).toEqual(['start:first', 'finish:first', 'start:second', 'finish:second'])
  })

  it('should not serialize find calls outside a transaction', async () => {
    const calls: string[] = []
    const firstStarted = createDeferred()
    const releaseFirst = createDeferred()
    let activeFinds = 0
    let maxActiveFinds = 0

    const req = {
      payload: {
        find: async (args: { where: { id: { equals: string } } }) => {
          const id = args.where.id.equals

          calls.push(`start:${id}`)
          activeFinds += 1
          maxActiveFinds = Math.max(maxActiveFinds, activeFinds)

          if (id === 'first') {
            firstStarted.resolve()
            await releaseFirst.promise
          }

          calls.push(`finish:${id}`)
          activeFinds -= 1

          return { docs: [] }
        },
      },
    }

    const dataLoader = getDataLoader(req as never)
    const firstFind = dataLoader.find({
      collection: 'items',
      req,
      where: { id: { equals: 'first' } },
    } as never)

    await firstStarted.promise

    const secondFind = dataLoader.find({
      collection: 'items',
      req,
      where: { id: { equals: 'second' } },
    } as never)

    await secondFind

    expect(maxActiveFinds).toBe(2)
    expect(calls).toEqual(['start:first', 'start:second', 'finish:second'])

    releaseFirst.resolve()
    await firstFind

    expect(calls).toEqual(['start:first', 'start:second', 'finish:second', 'finish:first'])
  })
})
