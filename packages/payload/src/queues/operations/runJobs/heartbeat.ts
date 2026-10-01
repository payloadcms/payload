import type { PayloadRequest } from '../../../types/index.js'
import type { RunJobsSilent } from '../../localAPI.js'

import { getCurrentDate } from '../../utilities/getCurrentDate.js'
import { updateJobs } from '../../utilities/updateJob.js'

type ProcessingLeaseHeartbeatArgs = {
  jobIDs: (number | string)[]
  processingLeaseDuration: number
  processingLeaseSafetyBuffer: number
  processingToken: string
  req: PayloadRequest
  silent: RunJobsSilent
}

export function startProcessingLeaseHeartbeat(args: ProcessingLeaseHeartbeatArgs): () => void {
  const { processingLeaseDuration } = args
  const heartbeatInterval = Math.max(Math.floor(processingLeaseDuration / 3), 1)
  let isStopped = false
  let timeout: ReturnType<typeof setTimeout> | undefined

  const scheduleHeartbeat = () => {
    if (isStopped) {
      return
    }

    timeout = setTimeout(() => {
      void sendHeartbeat(args).finally(scheduleHeartbeat)
    }, heartbeatInterval)
    timeout.unref?.()
  }

  scheduleHeartbeat()

  return () => {
    isStopped = true
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

async function sendHeartbeat({
  jobIDs,
  processingLeaseDuration,
  processingLeaseSafetyBuffer,
  processingToken,
  req,
  silent,
}: ProcessingLeaseHeartbeatArgs): Promise<void> {
  const now = getCurrentDate()
  const minimumProcessingUntil = new Date(now.getTime() + processingLeaseSafetyBuffer).toISOString()
  const processingUntil = new Date(now.getTime() + processingLeaseDuration).toISOString()

  try {
    await updateJobs({
      data: { processingUntil },
      req,
      returning: false,
      where: {
        and: [
          { id: { in: jobIDs } },
          { processingToken: { equals: processingToken } },
          { processingUntil: { greater_than: minimumProcessingUntil } },
        ],
      },
    })
  } catch (error) {
    if (!silent || (typeof silent === 'object' && !silent.error)) {
      req.payload.logger.error({
        err: error,
        msg: 'Failed to renew job processing leases',
      })
    }
  }
}
