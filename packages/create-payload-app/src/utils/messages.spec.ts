import { describe, expect, it, vitest } from 'vitest'

import { helpMessage } from './messages.js'

describe('helpMessage', () => {
  it('should document db flags, secret, and the non-interactive -y flag', () => {
    const logSpy = vitest.spyOn(console, 'log').mockImplementation(() => {})

    helpMessage()

    const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n')

    expect(output).toContain('--db')
    expect(output).toContain('--db-connection-string')
    expect(output).toContain('--secret')
    expect(output).toContain('--yes')
    expect(output).toContain('my-project --db sqlite -y')
    expect(output).not.toContain('--db-accept-recommended')

    logSpy.mockRestore()
  })
})
