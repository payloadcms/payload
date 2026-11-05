import type { AuditEvent } from '../../__helpers/plugins/audit/index.js'
import type { ConfigChangeScorerResult, TranscriptEvent } from '../types.js'

const MUTATION_OPERATIONS = new Set(['autosave', 'create', 'delete', 'restoreVersion', 'update'])
const EXTRA_MODIFICATION_MULTIPLIER = 0.5
const EXTRA_TOOL_CALL_MULTIPLIER = 0.9
const FAILED_TOOL_CALL_MULTIPLIER = 0.5
const zeroUsage = { cachedInputTokens: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 }

export function getFinalAgentResponse({ transcript }: { transcript?: TranscriptEvent[] }): string {
  return (
    transcript
      ?.slice()
      .reverse()
      .find((event): event is Extract<TranscriptEvent, { type: 'text' }> => event.type === 'text')
      ?.text ?? ''
  )
}

/**
 * Makes sure the agent did not cheat, then scores how efficiently it used MCP.
 *
 * The eval should check the final result first. For example, it can check that the right document
 * was created or that the agent returned the right draft.
 *
 * This function then checks that the agent actually did the work through MCP. The case fails with
 * score `0` if the agent tried to use the Local or REST API, never touched the expected collection
 * or global, or never called a Payload MCP tool.
 *
 * If the agent did not cheat, its score starts at `1` and is reduced for wasted work:
 *
 * - each extra tool call: `× 0.9`;
 * - each failed tool call: `× 0.5`;
 * - each extra attempt to change data: `× 0.5`.
 *
 * Using fewer calls than the given optimum does not reduce the score. Calls are counted from the
 * full agent transcript, including calls that failed before reaching a tool handler.
 */
export function scoreMCPExecution({
  audit,
  optimalModificationAttempts,
  optimalToolCalls,
  requiredPayloadOperation,
  transcript,
}: {
  audit: AuditEvent[]
  optimalModificationAttempts: number
  optimalToolCalls: number
  requiredPayloadOperation: {
    entityType?: 'collection' | 'global'
    kind: 'mutation' | 'read'
    slug: string
  }
  transcript?: TranscriptEvent[]
}): ConfigChangeScorerResult {
  const payloadOperations = audit.filter((event) => event.type === 'payload-operation')
  const mcpToolCalls = audit.filter((event) => event.type === 'mcp-tool-call')
  const forbiddenAttempts = payloadOperations.filter(
    (attempt) => attempt.blocked || attempt.payloadAPI !== 'MCP',
  )

  if (forbiddenAttempts.length > 0) {
    return failedResult(
      `Blocked ${forbiddenAttempts.length} non-MCP Payload operation ${forbiddenAttempts.length === 1 ? 'attempt' : 'attempts'}: ${formatOperations(forbiddenAttempts)}.`,
    )
  }

  const matchingPayloadOperations = payloadOperations.filter(
    (attempt) =>
      attempt.slug === requiredPayloadOperation.slug &&
      (requiredPayloadOperation.entityType === undefined ||
        attempt.entityType === requiredPayloadOperation.entityType) &&
      (requiredPayloadOperation.kind === 'mutation'
        ? isMutation(attempt.operation)
        : !isMutation(attempt.operation)),
  )

  if (matchingPayloadOperations.length === 0) {
    return failedResult(
      `No audited MCP ${requiredPayloadOperation.kind} operation reached ${requiredPayloadOperation.entityType ?? 'entity'} "${requiredPayloadOperation.slug}".`,
    )
  }

  const transcriptCalls = getPayloadMCPTranscriptCalls(transcript)
  const toolCallCount = transcript === undefined ? mcpToolCalls.length : transcriptCalls.length

  if (toolCallCount === 0) {
    return failedResult('No Payload MCP tool call was attempted.')
  }

  const failedToolCalls =
    transcript === undefined
      ? mcpToolCalls.filter((toolCall) => toolCall.response.isError).length
      : transcriptCalls.filter(({ result }) => !result || isFailedToolResult(result)).length
  const modificationAttempts = payloadOperations.filter((attempt) =>
    isMutation(attempt.operation),
  ).length
  const extraToolCalls = Math.max(0, toolCallCount - optimalToolCalls)
  const extraModificationAttempts = Math.max(0, modificationAttempts - optimalModificationAttempts)
  const score =
    EXTRA_TOOL_CALL_MULTIPLIER ** extraToolCalls *
    FAILED_TOOL_CALL_MULTIPLIER ** failedToolCalls *
    EXTRA_MODIFICATION_MULTIPLIER ** extraModificationAttempts

  return {
    changeDescription: '',
    completeness: score,
    correctness: score,
    pass: true,
    reasoning: `Runtime outcome passed. ${toolCallCount} MCP tool ${pluralize(toolCallCount, 'call')} (${failedToolCalls} failed), ${modificationAttempts} Payload modification ${pluralize(modificationAttempts, 'attempt')}. Optimal allowances: ${optimalToolCalls} tool calls and ${optimalModificationAttempts} modification attempts.`,
    score,
    usage: zeroUsage,
  }
}

function failedResult(reasoning: string): ConfigChangeScorerResult {
  return {
    changeDescription: '',
    completeness: 0,
    correctness: 0,
    pass: false,
    reasoning,
    score: 0,
    usage: zeroUsage,
  }
}

function formatOperations(
  attempts: Array<Extract<AuditEvent, { type: 'payload-operation' }>>,
): string {
  return attempts
    .map(
      ({ slug, entityType, operation, payloadAPI }) =>
        `${payloadAPI} ${operation} ${entityType} "${slug}"`,
    )
    .join(', ')
}

function getPayloadMCPTranscriptCalls(transcript?: TranscriptEvent[]): Array<{
  result: Extract<TranscriptEvent, { type: 'tool_result' }> | undefined
  use: Extract<TranscriptEvent, { type: 'tool_use' }>
}> {
  if (!transcript) {
    return []
  }

  const results = new Map(
    transcript
      .filter(
        (event): event is Extract<TranscriptEvent, { type: 'tool_result' }> =>
          event.type === 'tool_result',
      )
      .map((event) => [event.toolUseId, event]),
  )

  return transcript
    .filter(
      (event): event is Extract<TranscriptEvent, { type: 'tool_use' }> =>
        event.type === 'tool_use' && event.name.startsWith('mcp__payload'),
    )
    .map((use) => ({ result: results.get(use.id), use }))
}

function isFailedToolResult(result: Extract<TranscriptEvent, { type: 'tool_result' }>): boolean {
  const content = result.content.trimStart()
  return (
    result.isError === true ||
    content.startsWith('Error:') ||
    content.startsWith('❌') ||
    /"isError"\s*:\s*true/.test(content)
  )
}

function isMutation(operation: string): boolean {
  return MUTATION_OPERATIONS.has(operation)
}

function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`
}
