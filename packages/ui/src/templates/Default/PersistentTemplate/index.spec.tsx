import { useState } from 'react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { PersistentTemplateProvider, PersistentTemplateRegistration } from './index.js'

test('preserves template component state when the route content changes', async () => {
  const screen = await render(<Fixture route="first" />)

  await screen.getByRole('button', { name: 'Increment' }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('1')

  await screen.rerender(<Fixture route="second" />)

  await expect.element(screen.getByText('second')).toBeVisible()
  await expect.element(screen.getByRole('status')).toHaveTextContent('1')
})

function Fixture({ route }: { route: string }) {
  return (
    <PersistentTemplateProvider>
      <PersistentTemplateRegistration key={route}>
        <Template route={route} />
      </PersistentTemplateRegistration>
    </PersistentTemplateProvider>
  )
}

function Template({ route }: { route: string }) {
  const [count, setCount] = useState(0)

  return (
    <main>
      <p>{route}</p>
      <output role="status">{count}</output>
      <button onClick={() => setCount((current) => current + 1)} type="button">
        Increment
      </button>
    </main>
  )
}
