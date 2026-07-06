import type { ConfigChangeScorerResult, EvalExpect, MCPToolCall } from '../types.js'

export function expectMCPToolCall({
  name,
  expect,
  input,
  mcpToolCalls,
  response,
}: {
  expect: EvalExpect
  input?: Record<string, unknown>
  mcpToolCalls: MCPToolCall[]
  name: string
  response?: Partial<MCPToolCall['response']>
}): MCPToolCall {
  const toolCall = mcpToolCalls.find(
    (call) =>
      call.name === name &&
      !call.response.isError &&
      (input === undefined || matchesPartial({ actual: call.input, expected: input })) &&
      (response === undefined || matchesPartial({ actual: call.response, expected: response })),
  )

  expect(toolCall).toBeDefined()

  return toolCall!
}

export function expectMCPDocumentRead({
  expect,
  matchesDocument,
  mcpToolCalls,
}: {
  expect: EvalExpect
  matchesDocument: (document: Record<string, unknown>) => boolean
  mcpToolCalls: MCPToolCall[]
}): Record<string, unknown> {
  const toolCall = mcpToolCalls.find(
    (call) =>
      call.name === 'findDocuments' &&
      !call.response.isError &&
      responseDocuments({ toolCall: call }).some(matchesDocument),
  )
  const document = responseDocuments({ toolCall }).find(matchesDocument)

  expect(document).toBeDefined()

  return document!
}

export function scoreMCPToolCallFailures({
  mcpToolCalls,
}: {
  mcpToolCalls: MCPToolCall[]
}): ConfigChangeScorerResult {
  const failedToolCalls = mcpToolCalls.filter((toolCall) => toolCall.response.isError)
  const score = 0.5 ** failedToolCalls.length
  const failedToolNames = failedToolCalls.map((toolCall) => toolCall.name).join(', ')

  return {
    changeDescription: '',
    completeness: score,
    correctness: score,
    pass: true,
    reasoning:
      failedToolCalls.length === 0
        ? 'Runtime verification passed with no failed MCP tool calls.'
        : `Runtime verification passed with ${failedToolCalls.length} failed MCP tool ${failedToolCalls.length === 1 ? 'call' : 'calls'}: ${failedToolNames}.`,
    score,
    usage: { cachedInputTokens: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  }
}

function responseDocuments({
  toolCall,
}: {
  toolCall: MCPToolCall | undefined
}): Record<string, unknown>[] {
  const documents = toolCall?.response.doc?.docs

  return Array.isArray(documents) ? (documents as Record<string, unknown>[]) : []
}

function matchesPartial({ actual, expected }: { actual: unknown; expected: unknown }): boolean {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((expectedItem, index) =>
        matchesPartial({ actual: actual[index], expected: expectedItem }),
      )
    )
  }

  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object') {
      return false
    }

    return Object.entries(expected).every(([key, value]) =>
      matchesPartial({
        actual: (actual as Record<string, unknown>)[key],
        expected: value,
      }),
    )
  }

  return Object.is(actual, expected)
}
