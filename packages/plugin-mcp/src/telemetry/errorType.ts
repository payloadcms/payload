import type { MCPToolResponse } from '../types.js'

export type MCPErrorType = 'access' | 'bad-request' | 'internal' | 'unknown' | 'validation'

const mcpErrorType = Symbol('mcpErrorType')

type TaggedMCPToolResponse = {
  [mcpErrorType]?: MCPErrorType
} & MCPToolResponse

export const getMcpErrorType = ({ response }: { response: MCPToolResponse }): MCPErrorType =>
  (response as TaggedMCPToolResponse)[mcpErrorType] ?? 'unknown'

/**
 * Symbols are preserved by response spreads but omitted from the serialized MCP response.
 */
export const withMcpErrorType = ({
  errorType,
  response,
}: {
  errorType: MCPErrorType
  response: MCPToolResponse
}): TaggedMCPToolResponse => ({
  ...response,
  [mcpErrorType]: errorType,
})
