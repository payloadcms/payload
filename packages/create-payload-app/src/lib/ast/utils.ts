import type { DetectionError } from './types'

interface FormatErrorOptions {
  actual: string
  context: string
  debugInfo?: Record<string, unknown>
  expected: string
  technicalDetails: string
}

export function formatError(options: FormatErrorOptions): DetectionError {
  const { actual, context, debugInfo, expected, technicalDetails } = options

  const userMessage = `Your config file doesn't match the expected structure for ${context}.

Expected: ${expected}
Actual: ${actual}

Please ensure your config file follows the expected structure.`

  return {
    technicalDetails,
    userMessage,
    ...(debugInfo && { debugInfo }),
  }
}
