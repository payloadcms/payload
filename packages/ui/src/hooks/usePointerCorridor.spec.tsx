import { useRef, useState } from 'react'
import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { usePointerCorridor } from './usePointerCorridor.js'

const CorridorExample = () => {
  const from = useRef<HTMLButtonElement>(null)
  const to = useRef<HTMLDivElement>(null)
  const [polygon, setPolygon] = useState<null | string>(null)
  const [isIdle, setIsIdle] = useState(false)
  const corridor = usePointerCorridor({
    enabled: true,
    from,
    idleTimeout: 100,
    onChange: ({ polygon }) => setPolygon(polygon),
    onRelease: () => setIsIdle(true),
    to,
  })

  return (
    <div data-testid="surface" style={{ inset: 0, position: 'fixed' }}>
      <button
        onPointerEnter={(event) => corridor.trackSource({ x: event.clientX, y: event.clientY })}
        onPointerLeave={(event) =>
          corridor.protect({ pointer: { x: event.clientX, y: event.clientY } })
        }
        ref={from}
        style={{ height: 30, left: 100, position: 'fixed', top: 100, width: 100 }}
        type="button"
      >
        Source
      </button>
      <div ref={to} style={{ height: 200, left: 300, position: 'fixed', top: 100, width: 100 }}>
        Target
      </div>
      <output data-testid="polygon">{polygon ?? 'inactive'}</output>
      <output data-testid="idle">{isIdle ? 'idle' : 'tracking'}</output>
    </div>
  )
}

test('should report corridor geometry and inactivity without Popup markup or a popover', async () => {
  await page.viewport(800, 600)
  const screen = await render(<CorridorExample />)

  await screen.getByRole('button', { name: 'Source' }).hover()
  await userEvent.hover(screen.getByTestId('surface'), {
    force: true,
    position: { x: 250, y: 160 },
  })

  expect(screen.getByTestId('polygon').element().textContent).toBe(
    'polygon(150px 111px, 300px 100px, 400px 100px, 400px 300px, 300px 300px, 150px 119px)',
  )
  await expect.element(screen.getByTestId('idle')).toHaveTextContent('idle')
  await expect.element(screen.getByTestId('polygon')).toHaveTextContent('inactive')
})
