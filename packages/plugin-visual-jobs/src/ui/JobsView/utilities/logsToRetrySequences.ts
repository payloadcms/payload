import type { JobLog } from 'payload'

export type RetrySequences = JobLog[][]

export function logsToRetrySequences(logs: JobLog[]): RetrySequences {
  const sequences: RetrySequences = []

  // Group logs by taskID
  const groupedByTaskID = new Map<string, JobLog[]>()

  logs.forEach((log) => {
    if (!groupedByTaskID.has(log.taskID)) {
      groupedByTaskID.set(log.taskID, [])
    }
    groupedByTaskID.get(log.taskID).push(log)
  })

  let curSequence: JobLog[] = []
  let i = 0
  for (const log of logs) {
    i++
    if (curSequence.length === 0 && sequences.length > 0) {
      const lastSequence = sequences[sequences.length - 1]
      let i = 0
      for (const entry of lastSequence) {
        i++
        if (i === lastSequence.length) {
          break
        }
        curSequence.push(entry)
      }
    }

    curSequence.push(log)
    if (log.state === 'failed') {
      sequences.push([...curSequence])
      curSequence = []
    }

    if (i === logs.length) {
      sequences.push([...curSequence])
    }
  }

  return sequences
}
