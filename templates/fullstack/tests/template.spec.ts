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
import { CallToActionBlockComponent } from '../src/components/blocks/CallToAction/index.js'
import { HeroBlockComponent } from '../src/components/blocks/Hero/index.js'
import { RenderBlocks } from '../src/components/blocks/RenderBlocks.js'
import { RichText } from '../src/components/RichText/index.js'
import { safeHref } from '../src/utilities/safeHref.js'

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

  it('should pass standalone integrity check without monorepo coupling', async () => {
    const { stdout } = await execFileAsync(process.execPath, ['scripts/verify-standalone.mjs'], {
      cwd: templateRoot,
    })
    expect(stdout).toContain('Fullstack Template Standalone Integrity Verified Successfully')
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

  it('should sanitize URLs via safeHref and reject protocol-relative and unsafe URLs', () => {
    expect(safeHref('/posts/example')).toBe('/posts/example')
    expect(safeHref('https://example.com/test')).toBe('https://example.com/test')
    expect(safeHref('http://localhost:3000')).toBe('http://localhost:3000')

    expect(safeHref('//external.example/attack')).toBeNull()
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,<script>')).toBeNull()
    expect(safeHref('not a url')).toBeNull()
    expect(safeHref('')).toBeNull()
    expect(safeHref('   ')).toBeNull()
    expect(safeHref(null)).toBeNull()
    expect(safeHref(undefined)).toBeNull()
  })

  it('should not render anchor tags in Hero and CallToAction when link is unsafe', () => {
    const heroMarkup = renderToStaticMarkup(
      HeroBlockComponent({
        headline: 'Safe Hero',
        ctaText: 'Click Me',
        ctaLink: '//external.example/evil',
      }),
    )
    expect(heroMarkup).not.toContain('<a')
    expect(heroMarkup).not.toContain('//external.example/evil')

    const ctaMarkup = renderToStaticMarkup(
      CallToActionBlockComponent({
        title: 'Safe CTA',
        buttonText: 'Action',
        buttonLink: '//external.example/evil',
      }),
    )
    expect(ctaMarkup).not.toContain('<a')
    expect(ctaMarkup).not.toContain('//external.example/evil')
  })

  it('should render anchor tags with valid href in Hero and CallToAction', () => {
    const heroMarkup = renderToStaticMarkup(
      HeroBlockComponent({
        headline: 'Hero Title',
        ctaText: 'Explore',
        ctaLink: '/posts/first-post',
      }),
    )
    expect(heroMarkup).toContain('<a class="template-button" href="/posts/first-post">Explore</a>')

    const ctaMarkup = renderToStaticMarkup(
      CallToActionBlockComponent({
        title: 'CTA Title',
        buttonText: 'Join Now',
        buttonLink: 'https://payloadcms.com',
      }),
    )
    expect(ctaMarkup).toContain(
      '<a class="template-button" href="https://payloadcms.com">Join Now</a>',
    )
  })

  it('should hide anchor tags in Hero and CallToAction for javascript:, data:, empty, and null', () => {
    for (const badLink of ['javascript:alert(1)', 'data:text/html,<script>', '', null]) {
      const hero = renderToStaticMarkup(
        HeroBlockComponent({
          headline: 'Hero',
          ctaText: 'Button',
          ctaLink: badLink,
        }),
      )
      expect(hero).not.toContain('<a')

      const cta = renderToStaticMarkup(
        CallToActionBlockComponent({
          title: 'CTA',
          buttonText: 'Button',
          buttonLink: badLink as string,
        }),
      )
      expect(cta).not.toContain('<a')
    }
  })

  it('should sanitize links and preserve fallback content in RichText', () => {
    const validData = {
      root: {
        children: [
          {
            type: 'link' as const,
            version: 1,
            fields: { url: '/safe-link', newTab: false, linkType: 'custom' as const },
            children: [{ type: 'text' as const, version: 1, text: 'Click Here', format: 0 }],
          },
        ],
      },
    }
    const validMarkup = renderToStaticMarkup(RichText({ data: validData as never }))
    expect(validMarkup).toContain('<a href="/safe-link"')
    expect(validMarkup).toContain('Click Here')

    const httpsData = {
      root: {
        children: [
          {
            type: 'link' as const,
            version: 1,
            fields: {
              url: 'https://payloadcms.com/docs',
              newTab: true,
              linkType: 'custom' as const,
            },
            children: [{ type: 'text' as const, version: 1, text: 'Documentation', format: 0 }],
          },
        ],
      },
    }
    const httpsMarkup = renderToStaticMarkup(RichText({ data: httpsData as never }))
    expect(httpsMarkup).toContain('<a href="https://payloadcms.com/docs"')
    expect(httpsMarkup).toContain('target="_blank"')
    expect(httpsMarkup).toContain('rel="noopener noreferrer"')
    expect(httpsMarkup).toContain('Documentation')

    for (const badUrl of [
      'javascript:alert(1)',
      '//external.example/evil',
      'data:text/html,<script>',
      '',
      null,
      undefined,
    ]) {
      const unsafeData = {
        root: {
          children: [
            {
              type: 'link' as const,
              version: 1,
              fields: { url: badUrl, newTab: false, linkType: 'custom' as const },
              children: [
                { type: 'text' as const, version: 1, text: 'Fallback Content', format: 0 },
              ],
            },
          ],
        },
      }
      const unsafeMarkup = renderToStaticMarkup(RichText({ data: unsafeData as never }))
      expect(unsafeMarkup).not.toContain('<a')
      expect(unsafeMarkup).toContain('Fallback Content')
    }
  })
})
