import { useEffect } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { configure } from 'vitest-browser-react/pure'

import { ActionsProvider, useActions } from './index.js'

configure({ reactStrictMode: true })

describe('ActionsProvider', () => {
  test('should keep actions set by a child on mount', async () => {
    const screen = await render(<ActionsFixture label="Set on mount" viewKey="first" />)

    await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'Set on mount')
  })

  test('should reset actions set by a previous view when the view key changes', async () => {
    const screen = await render(<ActionsFixture label="First view" viewKey="first" />)

    await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'First view')
    await screen.rerender(<ActionsFixture viewKey="second" />)
    await expect.element(screen.getByRole('status')).toHaveProperty('textContent', '')
  })

  test('should keep actions set on mount by the next view when the view key changes', async () => {
    const screen = await render(<ActionsFixture label="First view" viewKey="first" />)

    await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'First view')
    await screen.rerender(<ActionsFixture label="Second view" viewKey="second" />)
    await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'Second view')
  })
})

function ActionsFixture({ label, viewKey }: { label?: string; viewKey: string }) {
  return (
    <ActionsProvider viewKey={viewKey}>
      <RenderedActions />
      {label && <SetActionsOnMount key={viewKey} label={label} />}
    </ActionsProvider>
  )
}

function RenderedActions() {
  const { Actions } = useActions()

  return <output aria-label="Actions">{Object.values(Actions)}</output>
}

function SetActionsOnMount({ label }: { label: string }) {
  const { setViewActions } = useActions()

  useEffect(() => {
    setViewActions({ action: label })
  }, [label, setViewActions])

  return null
}
