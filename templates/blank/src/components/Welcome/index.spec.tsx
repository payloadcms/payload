import type { WidgetServerProps } from 'payload'

import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { WelcomeWidget } from './index'

it('should render the authenticated account as the page heading', () => {
  const props = {
    req: {
      payload: {
        config: {
          admin: { user: 'users' },
          collections: [{ admin: { useAsTitle: 'name' }, slug: 'users' }],
        },
      },
    },
    user: { email: 'avery@example.com', name: 'Avery Editor' },
  } as unknown as WidgetServerProps

  render(<WelcomeWidget {...props} />)

  expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Avery Editor' }).tagName).toBe(
    'H1',
  )
  expect(screen.queryByText('Signed in as avery@example.com')).toBeNull()
})
