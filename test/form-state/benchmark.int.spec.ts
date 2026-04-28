// Baseline (perf/form-state-v4 @ 0ceba0206fa838d66412640ad976e2572a97c768):
//   buildFormStateCalls: 24
//   renderFieldsCalls: 0
//   totalServerCallTimeMs: ~9.5
//   v4 target: buildFormStateCalls = 1 (initial paint), renderFieldsCalls <= 1 per visibility/structural reveal, per-keystroke = 0

import { beforeAll, describe, expect, it } from 'vitest'

import { type CallCounter, runScriptedEdit } from './benchmark.js'

describe('form-state call-frequency benchmark', () => {
  let counter: CallCounter

  beforeAll(async () => {
    counter = await runScriptedEdit({
      collection: 'posts',
      script: [
        { kind: 'type', path: 'title', value: 'Hello world', perCharDelay: 50 },
        { kind: 'type', path: 'validateUsingEvent', value: 'a short value', perCharDelay: 50 },
      ],
    })
  })

  it('records the documented baseline of buildFormState calls', () => {
    // Baseline pinned: 11 chars in "Hello world" + 13 chars in "a short value" = 24
    // calls. Phase 5 dispatch and Phase 6 budget will tighten this further.
    expect(counter.buildFormStateCalls).toBe(24)
    expect(counter.renderFieldsCalls).toBe(0)
  })
})
