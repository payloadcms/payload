import type { BrowserCommand } from 'vitest/node'

type Point = { x: number; y: number }

type MovePointerArgs = {
  intervalMs: number
  pointerType?: 'mouse' | 'pen'
  points: Point[]
  shouldClickAtEnd?: boolean
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    movePointer: (args: MovePointerArgs) => Promise<void>
  }
}

export const movePointer: BrowserCommand<[MovePointerArgs]> = async (
  context,
  { intervalMs, points, pointerType = 'mouse', shouldClickAtEnd = false },
) => {
  const frame = await context.frame()
  const frameBox = await (await frame.frameElement()).boundingBox()
  const frameWidth = await frame.evaluate(() => window.innerWidth)

  if (!frameBox) {
    throw new Error('movePointer could not measure the test frame')
  }

  const scale = frameBox.width / frameWidth
  const penSession =
    pointerType === 'pen' ? await context.page.context().newCDPSession(context.page) : null
  const startedAt = performance.now()

  for (const [index, { x, y }] of points.entries()) {
    const wait = startedAt + index * intervalMs - performance.now()

    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait))
    }

    const pagePoint = { x: frameBox.x + x * scale, y: frameBox.y + y * scale }

    if (penSession) {
      await penSession.send('Input.dispatchMouseEvent', {
        pointerType: 'pen',
        type: 'mouseMoved',
        ...pagePoint,
      })
    } else {
      await context.page.mouse.move(pagePoint.x, pagePoint.y)
    }
  }

  if (shouldClickAtEnd) {
    await context.page.mouse.down()
    await context.page.mouse.up()
  }
}
