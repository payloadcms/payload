import { loadEnv } from 'payload/node'

export async function setup() {
  loadEnv()

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('Set OPENAI_API_KEY or ANTHROPIC_API_KEY to run eval tests')
  }

  // Check agent auth once, before any test, so a missing login aborts the run
  // up front (with the exact login command) instead of failing every case.
  if (process.env.EVAL_RUNNER === 'claude-code') {
    const { preflightAgentAuth } = await import('./runner/claudeCode.js')
    await preflightAgentAuth()
  }
}
