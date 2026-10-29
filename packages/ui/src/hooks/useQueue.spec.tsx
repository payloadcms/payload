import { useEffect } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { useQueue } from './useQueue.js'

type QueueTask = ReturnType<typeof useQueue>['queueTask']

describe('useQueue', () => {
  test('should call beforeProcess before every task, not only the first', async () => {
    const queueTask = await renderQueue()
    const events: string[] = []
    const options = {
      afterProcess: () => {
        events.push('afterProcess')
      },
      beforeProcess: () => {
        events.push('beforeProcess')
      },
    }
    let finishFirstTask = () => {}
    const firstTask = new Promise<void>((resolve) => {
      finishFirstTask = resolve
    })

    queueTask(async () => {
      events.push('first task')
      await firstTask
    }, options)
    // Queued while the first task is running, so it runs straight after it
    queueTask(() => {
      events.push('second task')
      return Promise.resolve()
    }, options)
    finishFirstTask()

    await expect
      .poll(() => events)
      .toEqual([
        'beforeProcess',
        'first task',
        'afterProcess',
        'beforeProcess',
        'second task',
        'afterProcess',
      ])
  })

  test('should not process when beforeProcess returns false', async () => {
    const queueTask = await renderQueue()
    const events: string[] = []

    queueTask(
      () => {
        events.push('task')
        return Promise.resolve()
      },
      {
        beforeProcess: () => {
          events.push('beforeProcess')
          return false
        },
      },
    )

    expect(events).toEqual(['beforeProcess'])
  })
})

async function renderQueue(): Promise<QueueTask> {
  let queueTask: QueueTask | undefined

  await render(
    <QueueFixture
      onQueue={(queue) => {
        queueTask = queue
      }}
    />,
  )
  await expect.poll(() => queueTask).toBeDefined()

  return queueTask as QueueTask
}

function QueueFixture({ onQueue }: { onQueue: (queueTask: QueueTask) => void }) {
  const { queueTask } = useQueue()

  useEffect(() => {
    onQueue(queueTask)
  }, [onQueue, queueTask])

  return null
}
