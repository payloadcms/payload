import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { validateDemo } from './record-demo.mjs'

test('should circle a target without clicking or changing focus, then click normally', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-circle-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `
      export const presentation = {
        canvas: { width: 1000, height: 700 },
        change: { kind: 'Feature', title: 'Circle cursor', description: 'Emphasize a result.' },
      }
      export default async function({ circleCursor, click, expect, page }) {
        await page.goto('data:text/html,' + encodeURIComponent('<style>body{margin:0}button{position:absolute;left:220px;top:180px;width:100px;height:40px}input{position:absolute;left:20px;top:20px}</style><input autofocus><button onclick="this.dataset.clicked=String(event.isTrusted)">Target</button>'))
        const target = page.getByRole('button', { name: 'Target' })
        await click(page.locator('input'))
        await expect(page.locator('input')).toBeFocused()
        await page.evaluate(() => {
          window.moves = []
          document.addEventListener('mousemove', event => window.moves.push({ x: event.clientX, y: event.clientY }))
        })
        if (typeof circleCursor !== 'function') throw new Error('circleCursor helper is missing')
        await circleCursor(target)
        await expect(page.locator('input')).toBeFocused()
        await expect(target).not.toHaveAttribute('data-clicked')
        const moves = await page.evaluate(() => window.moves)
        const orbit = moves.slice(-76)
        if (orbit.length < 30) throw new Error('Circle has too few points')
        if (!orbit.some(p => p.x < 220) || !orbit.some(p => p.x > 320) || !orbit.some(p => p.y < 180) || !orbit.some(p => p.y > 220)) throw new Error('Pointer did not surround the target')
        const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y)
        const early = orbit.slice(20,30).reduce((n,p,i,a) => i ? n+distance(p,a[i-1]) : n,0)
        const late = orbit.slice(-10).reduce((n,p,i,a) => i ? n+distance(p,a[i-1]) : n,0)
        if (late >= early / 2) throw new Error('Circle did not ease out')
        const before = moves.length
        await click(target, {duration:100,before:0,after:0})
        await expect(target).toHaveAttribute('data-clicked','true')
        const after = await page.evaluate(() => window.moves)
        const firstAfter = after[before]
        if (distance(firstAfter,moves.at(-1))>5) throw new Error('Following click used stale pointer position')
      }
    `,
    )
    await validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'circle',
      scenario,
      viewport: { width: 800, height: 600 },
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('should keep circles inside the frame and reject invalid options before moving', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-circle-edge-'))
  const scenario = path.join(directory, 'scenario.mjs')

  try {
    await writeFile(
      scenario,
      `
      export const presentation = { change: { kind: 'Feature', title: 'Edge target', description: 'Keep the circle visible.' } }
      export default async function({ circleCursor, page }) {
        await page.goto('data:text/html,' + encodeURIComponent('<style>body{margin:0}button{position:fixed;right:0;bottom:0;width:80px;height:40px}</style><button>Edge</button>'))
        const target = page.getByRole('button',{name:'Edge'})
        await page.evaluate(() => {
          window.moves=[]
          document.addEventListener('mousemove', e => window.moves.push({x:e.clientX,y:e.clientY}))
        })
        if (typeof circleCursor !== 'function') throw new Error('circleCursor helper is missing')
        for (const options of [{duration:-1},{duration:NaN},{radius:0},{radius:Infinity},{pauseAfter:-1}]) {
          let rejected = false
          try { await circleCursor(target, options) } catch (e) { rejected=/non-negative|positive|finite/.test(e.message) }
          if (!rejected) throw new Error('Invalid circle option accepted')
        }
        if ((await page.evaluate(()=>window.moves.length)) !== 0) throw new Error('Invalid options moved the pointer')
        await circleCursor(target, {duration:0,pauseAfter:0})
        const moves=await page.evaluate(()=>window.moves)
        if(moves.some(p=>p.x<0||p.y<0||p.x>=800||p.y>=600)) throw new Error('Circle left the app viewport')
        if(moves.length<30) throw new Error('Zero-time validation skipped geometry')
      }
    `,
    )
    await validateDemo({
      baseURL: 'http://localhost:3000',
      label: 'circle-edge',
      scenario,
      viewport: { width: 800, height: 600 },
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
