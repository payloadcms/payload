import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'

import { DefaultFilter } from './index.js'

vi.mock('../Select/index.js', () => ({
  Select: ({ field }: { field: { admin: unknown } }) => (
    <div data-testid="select" data-has-admin={String(typeof field.admin === 'object')} />
  ),
}))

const baseProps = {
  disabled: false,
  onChange: vi.fn(),
  options: [],
  value: 'true',
}

test('renders the boolean select for an exists condition on a path without a field option', () => {
  const html = renderToStaticMarkup(
    <DefaultFilter
      {...baseProps}
      booleanSelect
      internalField={undefined as never}
      operator="exists"
    />,
  )

  expect(html).toContain('data-testid="select"')
  expect(html).toContain('data-has-admin="true"')
})

test('renders the boolean select for an exists condition on a known field', () => {
  const html = renderToStaticMarkup(
    <DefaultFilter
      {...baseProps}
      booleanSelect
      internalField={{ field: { name: 'title', type: 'text', admin: {} } } as never}
      operator="exists"
    />,
  )

  expect(html).toContain('data-testid="select"')
})
