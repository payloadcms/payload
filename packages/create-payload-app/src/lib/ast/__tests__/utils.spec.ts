import { formatError } from '../utils'

describe('formatError', () => {
  it('formats user-friendly error message', () => {
    const error = formatError({
      context: 'buildConfig call',
      expected: 'export default buildConfig({ ... })',
      actual: 'No buildConfig call found',
      technicalDetails: 'Could not find CallExpression with identifier buildConfig',
    })

    expect(error.userMessage).toContain('buildConfig call')
    expect(error.userMessage).toContain('Expected: export default buildConfig')
    expect(error.technicalDetails).toContain('CallExpression')
  })

  it('includes debug info when provided', () => {
    const error = formatError({
      context: 'test',
      expected: 'something',
      actual: 'nothing',
      technicalDetails: 'details',
      debugInfo: { line: 10, column: 5 },
    })

    expect(error.debugInfo).toEqual({ line: 10, column: 5 })
  })
})
