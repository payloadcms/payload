import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { devUser } from '../credentials.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('MCP Plugin', () => {
  let page: Page
  let serverURL: string
  let apiKey: string

  test.beforeAll(async ({ browser, request }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig({ dirname })
    serverURL = serverFromInit

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })

    // Login as dev user to get a JWT token for API key creation
    const loginRes = await request.post(`${serverURL}/api/users/login`, {
      data: { email: devUser.email, password: devUser.password },
    })
    expect(loginRes.ok()).toBeTruthy()
    const loginData = await loginRes.json()
    const token = loginData.token
    const userId = loginData.user.id

    // Create an API key with permissions to call tools/list
    const createKeyRes = await request.post(`${serverURL}/api/payload-mcp-api-keys`, {
      data: {
        enableAPIKey: true,
        label: 'E2E Test Key',
        apiKey: randomUUID(),
        user: userId,
        posts: { create: true, find: true, update: true, delete: true },
        products: { find: true },
      },
      headers: {
        Authorization: `JWT ${token}`,
      },
    })
    expect(createKeyRes.ok()).toBeTruthy()
    const keyData = await createKeyRes.json()
    apiKey = keyData.doc.apiKey
  })

  test('should not poison the Next.js runtime after MCP requests', async ({ request }) => {
    // --- 1. Baseline: verify routes are healthy before any MCP calls ---

    const healthBefore = await request.get(`${serverURL}/api/health`)
    expect(healthBefore.status()).toBe(200)

    const notFoundBefore = await request.get(`${serverURL}/api/nonexistent-mcp-test-route`)
    expect(notFoundBefore.status()).toBe(404)

    // --- 2. Send valid MCP requests ---
    // These trigger @modelcontextprotocol/sdk's StreamableHTTPServerTransport which
    // uses @hono/node-server's getRequestListener, replacing global.Request/Response.

    const mcpHeaders = {
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }

    const initRes = await request.post(`${serverURL}/api/mcp`, {
      data: {
        id: 1,
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          capabilities: {},
          clientInfo: { name: 'e2e-test', version: '1.0.0' },
          protocolVersion: '2024-11-05',
        },
      },
      headers: mcpHeaders,
    })
    expect(initRes.ok()).toBeTruthy()

    const toolsRes = await request.post(`${serverURL}/api/mcp`, {
      data: {
        id: 2,
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
      },
      headers: mcpHeaders,
    })
    expect(toolsRes.ok()).toBeTruthy()

    // --- 3. After MCP calls: routes must still respond correctly ---
    // Regression check for: https://github.com/payloadcms/payload/issues/15856
    // Without the fix, global.Response is permanently replaced by @hono/node-server,
    // causing Next.js route handler validation to fail with:
    // "Expected a Response object but received 'NextResponse'"

    const healthAfter = await request.get(`${serverURL}/api/health`)
    expect(healthAfter.status()).toBe(200)

    const notFoundAfter = await request.get(`${serverURL}/api/nonexistent-mcp-test-route`)
    expect(notFoundAfter.status()).toBe(404)
  })
})
