import { Activity, useEffect } from 'react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { configure } from 'vitest-browser-react/pure'

import { useControllableState } from './useControllableState.js'

configure({ reactStrictMode: true })

test('should use the initial prop value', async () => {
  const screen = await render(<StateFixture value="prop" />)

  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'prop')
})

for (const value of [null, undefined]) {
  test(`should use the fallback for ${String(value)}`, async () => {
    const screen = await render(<StateFixture value={value} />)

    await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'fallback')
  })
}

for (const value of ['', 0, false]) {
  test(`should preserve the falsy value ${JSON.stringify(value)}`, async () => {
    const screen = await render(<StateFixture value={value} />)

    await expect.element(screen.getByRole('status')).toHaveProperty('textContent', String(value))
  })
}

test('should preserve local updates when the prop is unchanged', async () => {
  const screen = await render(<StateFixture value="prop" />)

  await screen.getByRole('button', { name: 'Set local' }).click()
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
  await screen.rerender(<StateFixture value="prop" />)
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
})

test('should let changed props override local updates, including the original prop', async () => {
  const screen = await render(<StateFixture value="prop" />)

  await screen.getByRole('button', { name: 'Set local' }).click()
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
  await screen.rerender(<StateFixture value="changed" />)
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'changed')
  await screen.getByRole('button', { name: 'Set local' }).click()
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
  await screen.rerender(<StateFixture value="prop" />)
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'prop')
})

test('should compose functional updates in the same event', async () => {
  const screen = await render(<StateFixture value="prop" />)

  await screen.getByRole('button', { name: 'Append twice' }).click()
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'prop!!')
})

test('should preserve local updates when Strict Mode replays mount effects', async () => {
  const screen = await render(<StateFixture shouldUpdateOnMount value="prop" />)

  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
})

test('should preserve local updates across Activity hide and show', async () => {
  const screen = await render(<ActivityFixture value="prop" />)

  await screen.getByRole('button', { name: 'Set local' }).click()
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
  await screen.rerender(<ActivityFixture isHidden value="prop" />)
  await expect.element(screen.getByRole('status', { includeHidden: true })).not.toBeVisible()
  await screen.rerender(<ActivityFixture value="prop" />)
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
})

test('should apply a prop changed while Activity is hidden', async () => {
  const screen = await render(<ActivityFixture value="prop" />)

  await screen.getByRole('button', { name: 'Set local' }).click()
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'local')
  await screen.rerender(<ActivityFixture isHidden value="changed" />)
  await expect.element(screen.getByRole('status', { includeHidden: true })).not.toBeVisible()
  await screen.rerender(<ActivityFixture value="changed" />)
  await expect.element(screen.getByRole('status')).toHaveProperty('textContent', 'changed')
})

type StateFixtureProps = {
  fallback?: string
  isHidden?: boolean
  shouldUpdateOnMount?: boolean
  value?: boolean | null | number | string
}

function ActivityFixture(props: StateFixtureProps) {
  return (
    <Activity mode={props.isHidden ? 'hidden' : 'visible'}>
      <StateFixture {...props} />
    </Activity>
  )
}

function StateFixture({ fallback = 'fallback', shouldUpdateOnMount, value }: StateFixtureProps) {
  const [localValue, setValue] = useControllableState(value, fallback)

  return (
    <div>
      <output aria-label="Current value">{String(localValue)}</output>
      <button onClick={() => setValue('local')} type="button">
        Set local
      </button>
      <button
        onClick={() => {
          setValue((previous) => `${previous}!`)
          setValue((previous) => `${previous}!`)
        }}
        type="button"
      >
        Append twice
      </button>
      {shouldUpdateOnMount && <MountUpdate setValue={setValue} />}
    </div>
  )
}

function MountUpdate({ setValue }: { setValue: (value: string) => void }) {
  useEffect(() => {
    setValue('local')
  }, [setValue])

  return null
}
