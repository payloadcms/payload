import type { NanoBlockInfo } from './nano.js'

/**
 * Reads one block from the Nano node RPC the operator configured. Read-only: `block_info` is a
 * public ledger query, so no key, seed or wallet is involved.
 */
export const fetchBlockInfo = async ({
  fetchImpl = fetch,
  hash,
  headers,
  nodeURL,
  timeoutMs = 10000,
}: {
  fetchImpl?: typeof fetch
  hash: string
  headers?: Record<string, string>
  nodeURL: string
  timeoutMs?: number
}): Promise<NanoBlockInfo> => {
  const response = await fetchImpl(nodeURL, {
    body: JSON.stringify({ action: 'block_info', hash, json_block: 'true' }),
    headers: { 'Content-Type': 'application/json', ...headers },
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new Error(`Nano node answered HTTP ${response.status}`)
  }

  const body = (await response.json()) as { error?: unknown } & NanoBlockInfo

  if (!body || typeof body !== 'object' || body.error) {
    throw new Error('Nano block not found')
  }

  return body
}
