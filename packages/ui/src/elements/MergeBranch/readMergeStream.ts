import type { MergeProgress, MergeStreamEvent } from 'payload'

/**
 * Reads the NDJSON merge stream and returns its terminal event.
 *
 * A null result means that the connection ended before the server reported a
 * completion or error event.
 */
export const readMergeStream = async ({
  body,
  onProgress,
}: {
  body: ReadableStream<Uint8Array>
  onProgress: (progress: MergeProgress) => void
}): Promise<Extract<MergeStreamEvent, { type: 'complete' | 'error' }> | null> => {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffered = ''

  const handleLine = (
    line: string,
  ): Extract<MergeStreamEvent, { type: 'complete' | 'error' }> | null => {
    const trimmed = line.trim()

    if (!trimmed) {
      return null
    }

    let event: MergeStreamEvent

    try {
      event = JSON.parse(trimmed) as MergeStreamEvent
    } catch (_err) {
      return null
    }

    if (event.type === 'progress') {
      onProgress(event)

      return null
    }

    return event
  }

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffered += decoder.decode(value, { stream: true })

    const lines = buffered.split('\n')
    buffered = lines.pop() ?? ''

    for (const line of lines) {
      const terminal = handleLine(line)

      if (terminal) {
        return terminal
      }
    }
  }

  return handleLine(buffered)
}
