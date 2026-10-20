import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Button } from './index.js'

test('should use the tooltip as the accessible name of an icon-only button', async () => {
  const screen = await render(<Button icon="clipboard" tooltip="Paste from clipboard" />)

  await expect.element(screen.getByRole('button', { name: 'Paste from clipboard' })).toBeVisible()
})

test('should prefer an explicit aria-label over the tooltip', async () => {
  const screen = await render(<Button aria-label="Cancel upload" icon="x" tooltip="Cancel" />)

  await expect.element(screen.getByRole('button', { name: 'Cancel upload' })).toBeVisible()
})

test('should keep the visible text as the accessible name of a button with a tooltip', async () => {
  const screen = await render(<Button tooltip="Saves the document">Save</Button>)

  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeVisible()
})
