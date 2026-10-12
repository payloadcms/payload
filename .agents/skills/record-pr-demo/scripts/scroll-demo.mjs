export function createScrollInteraction({ moveCursor, page }) {
  return async function scroll(
    locator,
    {
      axis = 'y',
      to = 'end',
      duration = 950,
      easing = 'easeInOutSine',
      cursorPlacement = 'outside',
      input = 'animation',
      settle = 150,
    } = {},
  ) {
    if (!['x', 'y'].includes(axis) || !['animation', 'wheel'].includes(input)) {
      throw new Error('Scroll axis must be x or y and input must be animation or wheel')
    }
    if (!['outside', 'inside'].includes(cursorPlacement) || easing !== 'easeInOutSine') {
      throw new Error('Scroll requires outside/inside cursor placement and easeInOutSine easing')
    }
    if (![duration, settle].every((value) => Number.isFinite(value) && value >= 0)) {
      throw new Error('Scroll timing must be finite and non-negative')
    }
    if (to !== 'start' && to !== 'end' && !Number.isFinite(to)) {
      throw new Error('Scroll target must be start, end, or a finite number')
    }
    if (input === 'wheel' && cursorPlacement !== 'inside') {
      throw new Error('Wheel input requires cursorPlacement: inside for real hit testing')
    }

    await locator.scrollIntoViewIfNeeded()
    const range = await locator.evaluate((element, axis) => {
      const maximum =
        axis === 'x'
          ? element.scrollWidth - element.clientWidth
          : element.scrollHeight - element.clientHeight
      const direction = axis === 'x' && getComputedStyle(element).direction === 'rtl' ? -1 : 1

      return { direction, maximum, start: axis === 'x' ? element.scrollLeft : element.scrollTop }
    }, axis)

    if (range.maximum <= 0) {
      throw new Error(`Demo scroll target does not overflow on axis ${axis}`)
    }
    const offset = to === 'start' ? 0 : to === 'end' ? range.maximum : to
    const target = Math.round(Math.max(0, Math.min(range.maximum, offset))) * range.direction || 0
    let anchor

    try {
      if (cursorPlacement === 'outside') {
        const box = await locator.boundingBox()
        const viewport = page.viewportSize()

        if (!box || !viewport) throw new Error('Cannot place the cursor outside this scroller')
        const candidates = [
          { x: box.x + box.width / 2, y: box.y + box.height + 8 },
          { x: box.x + box.width / 2, y: box.y - 8 },
          { x: box.x + box.width + 8, y: box.y + box.height / 2 },
          { x: box.x - 8, y: box.y + box.height / 2 },
        ]
        const point = candidates.find(
          ({ x, y }) => x >= 0 && y >= 0 && x < viewport.width && y < viewport.height,
        )

        if (!point) throw new Error('No visible position outside the scroller for the demo cursor')
        anchor = await page.evaluateHandle(({ x, y }) => {
          const element = document.createElement('div')
          element.setAttribute('data-pr-demo-scroll-anchor', '')
          Object.assign(element.style, {
            position: 'fixed',
            left: `${x}px`,
            top: `${y}px`,
            width: '1px',
            height: '1px',
            opacity: '0',
            pointerEvents: 'none',
          })
          document.documentElement.append(element)
          return element
        }, point)
        await moveCursor(page.locator('[data-pr-demo-scroll-anchor]'), { pauseAfter: 0 })
      } else {
        await moveCursor(locator, { pauseAfter: 0 })
      }

      if (input === 'animation') {
        await locator.evaluate(
          async (element, { axis, duration, start, target }) => {
            const property = axis === 'x' ? 'scrollLeft' : 'scrollTop'
            const direction = Math.sign(target - start)
            let previous = start
            const startedAt = performance.now()

            await new Promise((resolve, reject) => {
              const frame = (now) => {
                if (!element.isConnected) return reject(new Error('Scroll target was removed'))
                const progress = duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration)
                const eased = (1 - Math.cos(Math.PI * progress)) / 2
                element[property] = progress === 1 ? target : start + (target - start) * eased
                const current = element[property]

                if ((current - previous) * direction < -0.5) {
                  return reject(new Error('Demo scroll progress was not monotonic'))
                }
                previous = current
                if (progress === 1) return resolve()
                requestAnimationFrame(frame)
              }
              requestAnimationFrame(frame)
            })
          },
          { axis, duration, start: range.start, target },
        )
      } else {
        const steps = Math.max(1, Math.ceil(duration / 40))
        let previous = range.start

        for (let step = 1; step <= steps; step += 1) {
          const eased = (1 - Math.cos((Math.PI * step) / steps)) / 2
          const next = step === steps ? target : range.start + (target - range.start) * eased
          const delta = next - previous

          await page.mouse.wheel(axis === 'x' ? delta : 0, axis === 'y' ? delta : 0)
          await waitForPosition({ axis, locator, target: next })
          const current = await readPosition({ axis, locator })

          if ((current - previous) * Math.sign(target - range.start) < -0.5) {
            throw new Error('Demo wheel scroll progress was not monotonic')
          }
          previous = current
          if (duration > 0) await page.waitForTimeout(duration / steps)
        }
      }
      await waitForPosition({ axis, locator, target })
      if (settle > 0) await page.waitForTimeout(settle)
      const position = await readPosition({ axis, locator })

      if (Math.abs(position - target) > 0.5)
        throw new Error('Demo scroll did not settle at its target')
      return { position, target }
    } finally {
      if (anchor) {
        try {
          await anchor.evaluate((element) => element.remove())
        } finally {
          await anchor.dispose()
        }
      }
    }
  }
}

async function readPosition({ axis, locator }) {
  return locator.evaluate(
    (element, axis) => (axis === 'x' ? element.scrollLeft : element.scrollTop),
    axis,
  )
}

async function waitForPosition({ axis, locator, target }) {
  const deadline = Date.now() + 2000

  do {
    if (Math.abs((await readPosition({ axis, locator })) - target) <= 0.5) return
    await new Promise((resolve) => setTimeout(resolve, 16))
  } while (Date.now() < deadline)
  throw new Error(`Demo scroll did not reach ${target} on axis ${axis}`)
}
