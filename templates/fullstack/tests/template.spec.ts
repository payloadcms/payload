import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { adminOnly, authenticated, authenticatedOrPublished } from '../src/access/index.js'
import { Categories } from '../src/collections/Categories/index.js'
import { Media } from '../src/collections/Media/index.js'
import { Posts } from '../src/collections/Posts/index.js'
import { Users } from '../src/collections/Users/index.js'
import { CallToActionBlock } from '../src/blocks/CallToAction.js'
import { HeroBlock } from '../src/blocks/Hero.js'
import { RenderBlocks } from '../src/components/blocks/RenderBlocks.js'

const execFileAsync = promisify(execFile)
const templateRoot = path.resolve(import.meta.dirname, '..')

const request = (user?: { role?: string }) =>
  ({ req: { user }, slug: 'template-test' }) as Parameters<typeof adminOnly>[0]

function fieldValidator(block: typeof HeroBlock | typeof CallToActionBlock, name: string) {
  const field = block.fields.find((candidate) => 'name' in candidate && candidate.name === name)
  if (!field || !('validate' in field) || typeof field.validate !== 'function') {
    throw new Error(`Missing validator for ${name}`)
  }
  return field.validate
}

describe('fullstack template boundaries and contracts', () => {
  it('should pass the template boundary check without importing community fixtures', async () => {
    const { stdout } = await execFileAsync(process.execPath, ['scripts/check-boundary.mjs'], {
      cwd: templateRoot,
    })
    expect(stdout).toContain('Template boundary check passed.')
  })

  it('should allow destructive access only to administrators', () => {
    expect(adminOnly(request())).toBe(false)
    expect(adminOnly(request({ role: 'editor' }))).toBe(false)
    expect(adminOnly(request({ role: 'admin' }))).toBe(true)

    for (const collection of [Users, Posts, Categories, Media]) {
      expect(collection.access?.create?.(request())).toBe(false)
      expect(collection.access?.delete?.(request())).toBe(false)
      expect(collection.access?.update?.(request())).toBe(false)
    }
  })

  it('should deny anonymous category and media reads', () => {
    expect(authenticated(request())).toBe(false)
    expect(Categories.access?.read?.(request())).toBe(false)
    expect(Media.access?.read?.(request())).toBe(false)
    expect(Categories.access?.read?.(request({ role: 'admin' }))).toBe(true)
  })

  it('should restrict anonymous post reads to published documents', async () => {
    expect(authenticatedOrPublished(request())).toEqual({ _status: { equals: 'published' } })
    expect(authenticatedOrPublished(request({ role: 'admin' }))).toBe(true)
    expect(Posts.access?.read?.(request())).toEqual({ _status: { equals: 'published' } })

    const source = await readFile(path.join(templateRoot, 'src/app/posts/[slug]/page.tsx'), 'utf8')
    expect(source).toContain("_status: { equals: 'published' }")
  })

  it('should render a stable fallback for unknown block types', () => {
    const markup = renderToStaticMarkup(
      RenderBlocks({ blocks: [{ blockType: 'unknownBlock', id: 'unknown-1' }] }),
    )
    expect(markup).toContain('class="block-unknown"')
    expect(markup).toContain('This content block is not available.')
  })

  it('should accept relative and HTTP(S) URLs while rejecting unsafe schemes', () => {
    const optionalLink = fieldValidator(HeroBlock, 'ctaLink')
    const requiredLink = fieldValidator(CallToActionBlock, 'buttonLink')
    for (const value of ['/posts/example', 'https://example.com', 'http://localhost:3000/path']) {
      expect(optionalLink(value, {} as never)).toBe(true)
      expect(requiredLink(value, {} as never)).toBe(true)
    }
    for (const value of ['javascript:alert(1)', 'mailto:test@example.com', 'not a url']) {
      expect(optionalLink(value, {} as never)).toMatch(/relative path|HTTP\(S\)/)
      expect(requiredLink(value, {} as never)).toMatch(/relative path|HTTP\(S\)/)
    }
    expect(requiredLink('', {} as never)).toBe('A valid link is required.')
  })
})
