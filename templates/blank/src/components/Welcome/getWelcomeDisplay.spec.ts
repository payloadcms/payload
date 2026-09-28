import { describe, expect, it } from 'vitest'

import { getWelcomeDisplay } from './getWelcomeDisplay'

describe('getWelcomeDisplay', () => {
  it('should show the email for an email-based account', () => {
    expect(
      getWelcomeDisplay({
        user: { email: 'editor@example.com', id: '1' },
      }),
    ).toBe('editor@example.com')
  })

  it('should show the username for a username-based account', () => {
    expect(
      getWelcomeDisplay({
        user: { email: 'editor@example.com', id: '1', username: 'editor' },
      }),
    ).toBe('editor')
  })

  it('should show the configured title and the account email', () => {
    expect(
      getWelcomeDisplay({
        useAsTitle: 'name',
        user: { email: 'editor@example.com', id: '1', name: 'Avery Editor' },
      }),
    ).toBe('Avery Editor')
  })

  it('should fall back to an available username when the title is empty', () => {
    expect(
      getWelcomeDisplay({
        useAsTitle: 'name',
        user: { id: '1', name: ' ', username: 'editor' },
      }),
    ).toBe('editor')
  })

  it('should show the account ID when no title or login identifier is available', () => {
    expect(getWelcomeDisplay({ user: { id: 42 } })).toBe('42')
  })
})
