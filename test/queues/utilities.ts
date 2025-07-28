import {
  _internal_jobSystemGlobals,
  countRunnableOrActiveJobsForQueue,
  createLocalReq,
  type Payload,
} from 'payload'

export async function waitUntilAutorunIsDone({
  payload,
  queue,
  onlyScheduled = false,
}: {
  onlyScheduled?: boolean
  payload: Payload
  queue: string
}): Promise<void> {
  const req = await createLocalReq({}, payload)

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const count = await countRunnableOrActiveJobsForQueue({
        queue,
        req,
        onlyScheduled,
      })
      if (count === 0) {
        clearInterval(interval)
        resolve()
      }
    }, 200)
  })
}

export function timeFreeze() {
  const curDate = new Date()
  _internal_jobSystemGlobals.getCurrentDate = () => curDate
}

export function timeTravel(seconds: number) {
  const curDate = _internal_jobSystemGlobals.getCurrentDate()
  _internal_jobSystemGlobals.getCurrentDate = () => new Date(curDate.getTime() + seconds * 1000)
}

export async function withoutAutoRun<T>(fn: () => Promise<T>): Promise<T> {
  const originalValue = _internal_jobSystemGlobals.shouldAutoRun
  _internal_jobSystemGlobals.shouldAutoRun = false
  try {
    return await fn()
  } finally {
    _internal_jobSystemGlobals.shouldAutoRun = originalValue
  }
}

export async function withoutAutoSchedule<T>(fn: () => Promise<T>): Promise<T> {
  const originalValue = _internal_jobSystemGlobals.shouldAutoSchedule
  _internal_jobSystemGlobals.shouldAutoSchedule = false
  try {
    return await fn()
  } finally {
    _internal_jobSystemGlobals.shouldAutoSchedule = originalValue
  }
}
