import type { MergeResult } from '../merge.js'

import type { MergeProgress } from '../types.js'

/**
 * One line of the streamed merge response.
 *
 * NDJSON rather than server-sent events: the client is a `fetch` reading a
 * `ReadableStream`, not an `EventSource`, so the framing SSE adds buys nothing —
 * and one JSON object per line is trivially parseable from a reader loop.
 */
export type MergeStreamEvent =
  | { message: string; type: 'error' }
  | { result: MergeResult; type: 'complete' }
  | ({ type: 'progress' } & MergeProgress)
