import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  buildMcpServer: vi.fn(),
  configPath: '',
  createPayloadRequest: vi.fn(),
  getAccessResults: vi.fn(),
  getPayload: vi.fn(),
  serveStdio: vi.fn(),
}))

vi.mock('@modelcontextprotocol/server/stdio', () => ({ serveStdio: mocks.serveStdio }))
vi.mock('payload', () => ({
  createPayloadRequest: mocks.createPayloadRequest,
  getAccessResults: mocks.getAccessResults,
  getPayload: mocks.getPayload,
  UnauthorizedError: class extends Error {},
}))
vi.mock('payload/node', () => ({
  findConfig: () => mocks.configPath,
  loadEnv: vi.fn(),
}))
vi.mock('./mcp/buildMcpServer.js', () => ({ buildMcpServer: mocks.buildMcpServer }))
vi.mock('./mcp/sanitizeMCPConfig.js', () => ({ sanitizeMCPConfig: vi.fn() }))
vi.mock('./utils/resolveProjectRoot.js', () => ({ resolveProjectRoot: () => undefined }))

import { runMcpStdio } from './stdio.js'

describe('MCP stdio authorization', () => {
  let configDirectory: string
  let processOnce: ReturnType<typeof vi.spyOn>
  let stdinOnce: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.clearAllMocks()
    configDirectory = await mkdtemp(path.join(os.tmpdir(), 'payload-mcp-stdio-'))
    mocks.configPath = path.join(configDirectory, 'payload.config.mjs')
    await writeFile(mocks.configPath, 'export default {}\n')

    mocks.createPayloadRequest.mockImplementation(({ payload, req }) => ({ ...req, payload }))
    mocks.getAccessResults.mockResolvedValue({ collections: {}, globals: {} })
    mocks.serveStdio.mockImplementation((createServer) => {
      createServer()
      return { close: vi.fn() }
    })
    processOnce = vi.spyOn(process, 'once')
    stdinOnce = vi.spyOn(process.stdin, 'once')
  })

  afterEach(async () => {
    for (const [event, listener] of processOnce.mock.calls) {
      if (event === 'SIGINT' || event === 'SIGTERM') {
        process.removeListener(event, listener)
      }
    }
    for (const [event, listener] of stdinOnce.mock.calls) {
      if (event === 'close') {
        process.stdin.removeListener(event, listener)
      }
    }
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    await rm(configDirectory, { force: true, recursive: true })
  })

  for (const nodeEnv of ['development', 'production', 'test', undefined]) {
    for (const isAuthenticated of [false, true]) {
      it(`should enforce ${isAuthenticated ? 'authenticated' : 'anonymous'} access with the removed override flag when NODE_ENV is ${nodeEnv ?? 'unset'}`, async () => {
        vi.stubEnv('NODE_ENV', nodeEnv)
        vi.stubEnv('PAYLOAD_MCP_OVERRIDE_ACCESS', 'true')
        vi.stubEnv(
          'PAYLOAD_MCP_AUTHORIZATION',
          isAuthenticated ? 'users API-Key test-key' : undefined,
        )

        const user = isAuthenticated ? { id: 'user', collection: 'users' } : null
        const authenticatedTool = {
          type: 'tool',
          tool: { access: vi.fn(({ req }) => Boolean(req.user)) },
        }
        const deniedTool = { type: 'tool', tool: { access: vi.fn(() => false) } }
        const auth = vi.fn().mockResolvedValue({ user })

        mocks.getPayload.mockResolvedValue({
          auth,
          config: {
            plugins: [
              {
                slug: '@payloadcms/plugin-mcp',
                sanitizedOptions: { items: [authenticatedTool, deniedTool] },
              },
            ],
          },
        })

        await runMcpStdio()

        expect(auth).toHaveBeenCalledOnce()
        const headers = auth.mock.calls[0]![0].headers as Headers
        expect(headers.get('DisableAutologin')).toBe('true')
        expect(headers.get('Authorization')).toBe(isAuthenticated ? 'users API-Key test-key' : null)
        expect(authenticatedTool.tool.access).toHaveBeenCalledOnce()
        expect(deniedTool.tool.access).toHaveBeenCalledOnce()
        expect(mocks.buildMcpServer).toHaveBeenCalledWith(
          expect.objectContaining({
            authorizedMCP: {
              items: isAuthenticated ? [authenticatedTool] : [],
              overrideAccess: false,
            },
            req: expect.objectContaining({ user }),
          }),
        )
      })
    }
  }
})
