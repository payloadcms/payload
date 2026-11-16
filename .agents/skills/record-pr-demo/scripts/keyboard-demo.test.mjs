import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createKeyInteraction } from './keyboard-demo.mjs'

for (const [name, options, pauseScale, expected] of [
  ['default settling', {}, 1, 800],
  ['custom settling', { settleMs: 800 }, 1, 800],
  ['no settling', { settleMs: 0 }, 1, 0],
  ['fast validation', { settleMs: 800 }, 0, 0],
]) {
  test(`should press the real key before ${name}`, async () => {
    const calls = []
    const page = {
      keyboard: { press: async (...args) => calls.push(['press', ...args]) },
      waitForTimeout: async (ms) => calls.push(['settle', ms]),
    }
    const pressKey = createKeyInteraction({ page, pauseScale })
    await pressKey({ key: 'Shift+Tab', ...options })
    assert.deepEqual(calls, [
      ['press', 'Shift+Tab', { delay: 80 * pauseScale }],
      ['settle', expected],
    ])
  })
}

test('should propagate a failed key press without settling', async () => {
  const pressKey = createKeyInteraction({
    page: {
      keyboard: {
        press: async () => {
          throw new Error('Input failed')
        },
      },
      waitForTimeout: async () => assert.fail('Should not settle after a failed press'),
    },
    pauseScale: 1,
  })
  await assert.rejects(pressKey({ key: 'Enter' }), /Input failed/)
})
