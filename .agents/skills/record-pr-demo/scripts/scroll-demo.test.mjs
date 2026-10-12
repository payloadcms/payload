import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { chromium } from '@playwright/test'

import { createScrollInteraction } from './scroll-demo.mjs'

let browser

before(async () => {
  browser = await chromium.launch({ headless: true })
})
after(async () => {
  await browser?.close()
})

async function withScroller({ run, direction = 'ltr' }) {
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } })

  try {
    await page.setContent(`<style>
      #scroller { margin: 50px; width: 200px; height: 24px; overflow: auto; direction: ${direction}; }
      #content { width: 600px; height: 240px; display: flex; }
      button { flex: 0 0 100px; height: 24px; }
    </style><div id="scroller"><div id="content">
      <button>A</button><button>B</button><button>C</button><button>D</button><button>E</button><button>F</button>
    </div></div>`)
    const locator = page.locator('#scroller')
    const moveCursor = async (target) => {
      const box = await target.boundingBox()

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    }
    const scroll = createScrollInteraction({ moveCursor, page })

    await run({ locator, moveCursor, page, scroll })
  } finally {
    await page.close()
  }
}

for (const axis of ['x', 'y']) {
  test(`should reach ${axis} start, end, numeric and clamped targets`, async () => {
    await withScroller({
      run: async ({ locator, page, scroll }) => {
        const maximum = axis === 'x' ? 400 : 216

        for (const [to, target] of [
          ['end', maximum],
          ['start', 0],
          [80, 80],
          [10000, maximum],
          [-20, 0],
        ]) {
          assert.deepEqual(await scroll(locator, { axis, to, duration: 50, settle: 0 }), {
            position: target,
            target,
          })
          assert.equal(await page.locator('[data-pr-demo-scroll-anchor]').count(), 0)
        }
      },
    })
  })
}

test('should interpret horizontal RTL targets as distance from the start', async () => {
  await withScroller({
    direction: 'rtl',
    run: async ({ locator, scroll }) => {
      assert.deepEqual(await scroll(locator, { axis: 'x', to: 'end', duration: 50, settle: 0 }), {
        position: -400,
        target: -400,
      })
      assert.deepEqual(await scroll(locator, { axis: 'x', to: 'start', duration: 50, settle: 0 }), {
        position: 0,
        target: 0,
      })
    },
  })
})

test('should fail clearly when the target does not overflow', async () => {
  await withScroller({
    run: async ({ locator, scroll }) => {
      await locator.locator('#content').evaluate((element) => {
        element.style.width = '100px'
        element.replaceChildren()
      })
      await assert.rejects(scroll(locator, { axis: 'x' }), /does not overflow/)
    },
  })
})

test('should animate monotonically with sine easing and avoid hover churn', async () => {
  await withScroller({
    run: async ({ locator, page, scroll }) => {
      await page.evaluate(() => {
        window.hoverCount = 0
        document.querySelectorAll('button').forEach((button) => {
          button.addEventListener('mouseenter', () => {
            window.hoverCount += 1
          })
        })
        const element = document.querySelector('#scroller')
        window.samples = []
        let startedAt
        const sample = (time) => {
          if (element.scrollLeft > 0 && !startedAt) startedAt = time
          if (startedAt)
            window.samples.push({ time: time - startedAt, position: element.scrollLeft })
          window.sampleFrame = requestAnimationFrame(sample)
        }
        window.sampleFrame = requestAnimationFrame(sample)
      })
      await scroll(locator, { axis: 'x', duration: 500, settle: 30 })
      const { samples, hoverCount } = await page.evaluate(() => {
        cancelAnimationFrame(window.sampleFrame)
        return { samples: window.samples, hoverCount: window.hoverCount }
      })

      assert.equal(hoverCount, 0)
      assert.ok(samples.length > 10)
      for (let index = 1; index < samples.length; index += 1) {
        assert.ok(samples[index].position >= samples[index - 1].position)
      }
      assert.equal(samples.at(-1).position, 400)
      // A sine ease spends the first quarter below a linear quarter-distance.
      const quarter = samples.find(({ time }) => time >= 100)

      assert.ok(quarter.position < 100)
    },
  })
})

test('should remove the cursor anchor when cursor movement fails', async () => {
  await withScroller({
    run: async ({ locator, page }) => {
      const scroll = createScrollInteraction({
        page,
        moveCursor: async () => {
          throw new Error('cursor failed')
        },
      })

      await assert.rejects(scroll(locator, { axis: 'x' }), /cursor failed/)
      assert.equal(await page.locator('[data-pr-demo-scroll-anchor]').count(), 0)
    },
  })
})

test('should remove the anchor when the scroller disappears during animation', async () => {
  await withScroller({
    run: async ({ locator, moveCursor, page }) => {
      const scroll = createScrollInteraction({
        page,
        moveCursor: async (anchor) => {
          await moveCursor(anchor)
          await locator.evaluate((element) => {
            setTimeout(() => element.remove(), 40)
          })
        },
      })

      await assert.rejects(scroll(locator, { axis: 'x', duration: 300 }), /target was removed/)
      assert.equal(await page.locator('[data-pr-demo-scroll-anchor]').count(), 0)
    },
  })
})

test('should send real wheel events and never repair prevented input', async () => {
  await withScroller({
    run: async ({ locator, page, scroll }) => {
      await locator.evaluate((element) => {
        window.wheels = []
        element.addEventListener('wheel', (event) => window.wheels.push(event.deltaX))
      })
      assert.deepEqual(
        await scroll(locator, {
          axis: 'x',
          input: 'wheel',
          cursorPlacement: 'inside',
          duration: 200,
          settle: 30,
        }),
        { position: 400, target: 400 },
      )
      const wheels = await page.evaluate(() => window.wheels)

      assert.ok(wheels.length > 1)
      assert.ok(wheels.every((delta) => delta > 0 && delta < 400))
      await locator.evaluate((element) => {
        element.addEventListener('wheel', (event) => event.preventDefault(), { passive: false })
      })
      await assert.rejects(
        scroll(locator, {
          axis: 'x',
          to: 'start',
          input: 'wheel',
          cursorPlacement: 'inside',
          duration: 0,
        }),
        /did not reach/,
      )
      assert.equal(await locator.evaluate((element) => element.scrollLeft), 400)
    },
  })
})
