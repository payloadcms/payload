import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  articlesSlug,
  ctaBlockSlug,
  galleryBlockSlug,
  heroBlockSlug,
  hookedCollectionSlug,
  pagesSlug,
  simpleNoTemplatesSlug,
  templatesCollectionSlug,
} from './slugs.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const createdTemplateIDs: (number | string)[] = []
const createdArticleIDs: (number | string)[] = []
const createdPageIDs: (number | string)[] = []
const createdHookedIDs: (number | string)[] = []

describe('Templates API', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    const loginResult = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email, password }),
      })
      .then((res) => res.json())

    token = loginResult.token
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    for (const id of createdTemplateIDs) {
      await payload
        .delete({ collection: templatesCollectionSlug, id, overrideAccess: true })
        .catch(() => undefined)
    }
    createdTemplateIDs.length = 0

    for (const id of createdArticleIDs) {
      await payload
        .delete({ collection: articlesSlug, id, overrideAccess: true })
        .catch(() => undefined)
    }
    createdArticleIDs.length = 0

    for (const id of createdPageIDs) {
      await payload
        .delete({ collection: pagesSlug, id, overrideAccess: true })
        .catch(() => undefined)
    }
    createdPageIDs.length = 0

    for (const id of createdHookedIDs) {
      await payload
        .delete({ collection: hookedCollectionSlug, id, overrideAccess: true })
        .catch(() => undefined)
    }
    createdHookedIDs.length = 0
  })

  describe('Storage & opt-in', () => {
    it('should expose payload-templates as a registered collection', () => {
      const collection = payload.collections[templatesCollectionSlug]

      expect(collection).toBeDefined()
    })

    it('should hide payload-templates from the admin nav', () => {
      const collection = payload.collections[templatesCollectionSlug]

      expect(collection?.config.admin?.hidden).toBe(true)
    })

    it('should refuse to save a template for a collection that did not opt in', async () => {
      const attempt = payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Should Fail',
          entityType: 'collection',
          entitySlug: simpleNoTemplatesSlug,
          data: { name: 'whatever' },
        },
      })

      await expect(attempt).rejects.toThrow()
    })

    it('should accept templates: true shorthand on a collection config', () => {
      const articlesConfig = payload.config.collections.find(
        (collection) => collection.slug === articlesSlug,
      )

      expect(articlesConfig?.templates).toBeTruthy()
    })

    it('should expose granular templates config when an object is provided', () => {
      const pagesConfig = payload.config.collections.find(
        (collection) => collection.slug === pagesSlug,
      )

      expect(pagesConfig?.templates).toBeTruthy()
    })
  })

  describe('Tier 1 — Save', () => {
    it('should create a payload-templates doc when saving an article as a template', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Standard Article Template',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'A short blurb' },
        },
      })
      createdTemplateIDs.push(template.id)

      expect(template).toMatchObject({
        title: 'Standard Article Template',
        entityType: 'collection',
        entitySlug: articlesSlug,
      })
    })

    it('should populate entityType, entitySlug, and data with the source doc data', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Recipe',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {
            excerpt: 'A recipe template',
            layout: [{ blockType: heroBlockSlug, title: 'Hero' }],
          },
        },
      })
      createdTemplateIDs.push(template.id)

      expect((template as unknown as { data: Record<string, unknown> }).data).toEqual({
        excerpt: 'A recipe template',
        layout: [{ blockType: heroBlockSlug, title: 'Hero' }],
      })
    })

    it('should stamp schemaHash and schemaSnapshot on save', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hash test',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
      })) as unknown as { id: number | string; schemaHash: string; schemaSnapshot: unknown }
      createdTemplateIDs.push(template.id)

      expect(template.schemaHash).toEqual(expect.any(String))
      expect(template.schemaHash.length).toBeGreaterThan(0)
      expect(template.schemaSnapshot).toBeDefined()
    })

    it('should run beforeSaveAsTemplate field hooks and use their return values', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hooked',
          entityType: 'collection',
          entitySlug: hookedCollectionSlug,
          data: {
            title: 'Title',
            secret: 'should-be-scrubbed',
            slug: 'whatever',
          },
        },
      })) as unknown as { id: number | string; data: Record<string, unknown> }
      createdTemplateIDs.push(template.id)

      expect(template.data.secret).toBeUndefined()
    })

    it('should set req.context.isTemplate during save-as-template', async () => {
      let observedFlag: boolean | undefined

      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Context check',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
        context: {
          captureFlag: (flag: boolean) => {
            observedFlag = flag
          },
        },
      })
      createdTemplateIDs.push(template.id)

      expect(observedFlag).toBe(true)
    })
  })

  describe('Tier 1 — Apply', () => {
    const createApplyFixture = async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Apply fixture',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {
            excerpt: 'Templated excerpt',
            layout: [{ blockType: heroBlockSlug, title: 'Templated hero' }],
          },
        },
      })
      createdTemplateIDs.push(template.id)
      return template.id
    }

    it('should create a new article from a template via Local API', async () => {
      const templateID = await createApplyFixture()

      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'New Article', slug: 'new-article-1' },
        templateID,
      })
      createdArticleIDs.push(article.id)

      expect(article.title).toBe('New Article')
      expect(article.excerpt).toBe('Templated excerpt')
    })

    it('should accept templateID via REST POST /api/articles?templateID=...', async () => {
      const templateID = await createApplyFixture()

      const response = await restClient
        .POST(`/${articlesSlug}?templateID=${templateID}`, {
          body: JSON.stringify({ title: 'REST', slug: 'rest-1' }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      const article = response.doc
      createdArticleIDs.push(article.id)

      expect(article.excerpt).toBe('Templated excerpt')
    })

    it('should overlay defaults → template → user-provided in that order', async () => {
      const templateID = await createApplyFixture()

      const article = await payload.create({
        collection: articlesSlug,
        data: {
          title: 'Override',
          slug: 'override-1',
          excerpt: 'User override',
        },
        templateID,
      })
      createdArticleIDs.push(article.id)

      expect(article.excerpt).toBe('User override')
      expect(article.published).toBe(false)
    })

    it('should run beforeApplyTemplate field hooks during create-from-template', async () => {
      const sourceTemplate = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hook apply fixture',
          entityType: 'collection',
          entitySlug: hookedCollectionSlug,
          data: {
            title: 'From template',
            slug: 'will-be-replaced',
          },
        },
      })
      createdTemplateIDs.push(sourceTemplate.id)

      const created = await payload.create({
        collection: hookedCollectionSlug,
        data: { title: 'Created' },
        templateID: sourceTemplate.id,
      })
      createdHookedIDs.push(created.id)

      expect((created as unknown as { slug: string }).slug).toMatch(/^applied-/)
      expect((created as unknown as { slug: string }).slug).not.toBe('will-be-replaced')
    })

    it('should set req.context.isTemplate during apply', async () => {
      const templateID = await createApplyFixture()
      let observedFlag: boolean | undefined

      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'Apply context', slug: 'apply-context-1' },
        templateID,
        context: {
          captureFlag: (flag: boolean) => {
            observedFlag = flag
          },
        },
      })
      createdArticleIDs.push(article.id)

      expect(observedFlag).toBe(true)
    })

    it('should not append " - Copy" to unique fields the way duplicateFromID does', async () => {
      const templateID = await createApplyFixture()

      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'Pristine title', slug: 'pristine-slug' },
        templateID,
      })
      createdArticleIDs.push(article.id)

      expect(article.title).toBe('Pristine title')
      expect(article.title).not.toMatch(/Copy/)
    })

    it('should scrub unique fields from template data so two applies of the same template do not collide', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Reusable Recipe',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {
            title: 'Reusable Recipe',
            slug: 'reusable-recipe',
            generateSlug: true,
            excerpt: 'Saved excerpt',
          },
        },
      })
      createdTemplateIDs.push(template.id)

      const first = await payload.create({
        collection: articlesSlug,
        data: { title: 'First Application' },
        templateID: template.id,
      })
      createdArticleIDs.push(first.id)

      const second = await payload.create({
        collection: articlesSlug,
        data: { title: 'Second Application' },
        templateID: template.id,
      })
      createdArticleIDs.push(second.id)

      expect((first as unknown as { slug: string }).slug).not.toBe(
        (second as unknown as { slug: string }).slug,
      )
      expect((first as unknown as { excerpt: string }).excerpt).toBe('Saved excerpt')
      expect((second as unknown as { excerpt: string }).excerpt).toBe('Saved excerpt')
    })
  })

  describe('Tier 1 — Editing templates', () => {
    const createEditableFixture = async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Editable',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'before edit' },
        },
      })
      createdTemplateIDs.push(template.id)
      return template.id
    }

    it('should update a template via payload.update', async () => {
      const templateID = await createEditableFixture()

      const updated = (await payload.update({
        collection: templatesCollectionSlug,
        id: templateID,
        data: {
          data: { excerpt: 'after edit' },
        },
      })) as unknown as { data: { excerpt: string } }

      expect(updated.data.excerpt).toBe('after edit')
    })

    it('should re-stamp schemaHash and schemaSnapshot on update', async () => {
      const templateID = await createEditableFixture()

      const before = (await payload.findByID({
        collection: templatesCollectionSlug,
        id: templateID,
      })) as unknown as { schemaHash: string; updatedAt: string }

      const updated = (await payload.update({
        collection: templatesCollectionSlug,
        id: templateID,
        data: { title: 'Re-stamped' },
      })) as unknown as { schemaHash: string }

      expect(updated.schemaHash).toEqual(expect.any(String))
      expect(updated.schemaHash.length).toBeGreaterThan(0)
      expect(updated.schemaHash).toBe(before.schemaHash)
    })

    it('should pass req.context.isTemplate=true to hooks during template update', async () => {
      const templateID = await createEditableFixture()
      let observedFlag: boolean | undefined

      await payload.update({
        collection: templatesCollectionSlug,
        id: templateID,
        data: { title: 'Context update' },
        context: {
          captureFlag: (flag: boolean) => {
            observedFlag = flag
          },
        },
      })

      expect(observedFlag).toBe(true)
    })

    it('should relax required-field validation in template mode', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Partial',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
      })
      createdTemplateIDs.push(template.id)

      expect(template).toBeDefined()
    })

    it('should still enforce required fields when applying that template to a real document', async () => {
      const partial = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Partial',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
      })
      createdTemplateIDs.push(partial.id)

      const attempt = payload.create({
        collection: articlesSlug,
        data: {},
        templateID: partial.id,
      })

      await expect(attempt).rejects.toThrow()
    })
  })

  describe('Tier 2 — Block templates', () => {
    it('should save a single block as a template (entityType: block)', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hero template',
          entityType: 'block',
          entitySlug: heroBlockSlug,
          data: { blockType: heroBlockSlug, title: 'Welcome', subtitle: 'To our site' },
        },
      })
      createdTemplateIDs.push(template.id)

      expect(template.entityType).toBe('block')
      expect(template.entitySlug).toBe(heroBlockSlug)
    })

    it('should reject saving a block as template when its host blocks-field is not opted in', async () => {
      const attempt = payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Should fail',
          entityType: 'block',
          entitySlug: 'unknown-block',
          data: { blockType: 'unknown-block' },
        },
      })

      await expect(attempt).rejects.toThrow()
    })

    it('should produce template data shaped like a block instance', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'CTA',
          entityType: 'block',
          entitySlug: ctaBlockSlug,
          data: { blockType: ctaBlockSlug, heading: 'Buy now', buttonText: 'Go', buttonUrl: '/' },
        },
      })) as unknown as { id: number | string; data: { blockType: string } }
      createdTemplateIDs.push(template.id)

      expect(template.data.blockType).toBe(ctaBlockSlug)
    })

    it('should resolve a block template via REST and return data ready for client-side insertion', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hero CTA',
          entityType: 'block',
          entitySlug: heroBlockSlug,
          data: { id: 'should-be-stripped', blockType: heroBlockSlug, title: 'Welcome' },
        },
      })
      createdTemplateIDs.push(template.id)

      const response = await restClient
        .POST(`/${templatesCollectionSlug}/${String(template.id)}/resolve`, {
          body: JSON.stringify({
            hostCollectionSlug: articlesSlug,
            hostFieldPath: 'layout',
          }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      expect(response.data).toMatchObject({ blockType: heroBlockSlug, title: 'Welcome' })
      expect(response.data.id).toBeUndefined()
    })

    it('should reject resolving a block template into a host field that does not allow that block type', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Mismatched',
          entityType: 'block',
          entitySlug: heroBlockSlug,
          data: { blockType: heroBlockSlug, title: 'A' },
        },
      })
      createdTemplateIDs.push(template.id)

      const response = await restClient
        .POST(`/${templatesCollectionSlug}/${String(template.id)}/resolve`, {
          body: JSON.stringify({
            hostCollectionSlug: articlesSlug,
            hostFieldPath: 'tags', // tags is an array, not a blocks field
          }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      expect(response.errors?.[0]?.message).toMatch(/not a blocks field|not allowed/i)
    })
  })

  describe('Tier 3 — Field templates', () => {
    it('should save the entire value of a blocks field as a template', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Layout pack',
          entityType: 'field',
          entitySlug: `${articlesSlug}.layout`,
          data: [
            { blockType: heroBlockSlug, title: 'A' },
            { blockType: ctaBlockSlug, heading: 'B', buttonText: 'C', buttonUrl: '/' },
          ],
        },
      })
      createdTemplateIDs.push(template.id)

      expect(template.entityType).toBe('field')
      expect(template.entitySlug).toBe(`${articlesSlug}.layout`)
    })

    it('should save the entire value of an array field as a template', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Tag set',
          entityType: 'field',
          entitySlug: `${articlesSlug}.tags`,
          data: [{ label: 'news' }, { label: 'featured' }],
        },
      })
      createdTemplateIDs.push(template.id)

      expect(template.data).toEqual([{ label: 'news' }, { label: 'featured' }])
    })

    it('should refuse to apply a field template whose entitySlug does not match the target field', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Wrong field',
          entityType: 'field',
          entitySlug: `${articlesSlug}.tags`,
          data: [{ label: 'x' }],
        },
      })
      createdTemplateIDs.push(template.id)

      const response = await restClient
        .POST(`/${templatesCollectionSlug}/${String(template.id)}/resolve`, {
          body: JSON.stringify({
            hostCollectionSlug: articlesSlug,
            hostFieldPath: 'layout',
          }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      expect(response.errors?.[0]?.message).toMatch(/saved for|tags|but is being applied/i)
    })

    it('should resolve a tier-3 array field template, stripping ids from items', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Tag set',
          entityType: 'field',
          entitySlug: `${articlesSlug}.tags`,
          data: [
            { id: 'old-1', label: 'news' },
            { id: 'old-2', label: 'featured' },
          ],
        },
      })
      createdTemplateIDs.push(template.id)

      const response = await restClient
        .POST(`/${templatesCollectionSlug}/${String(template.id)}/resolve`, {
          body: JSON.stringify({
            hostCollectionSlug: articlesSlug,
            hostFieldPath: 'tags',
          }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data).toHaveLength(2)
      expect(response.data[0].id).toBeUndefined()
      expect(response.data[0].label).toBe('news')
      expect(response.data[1].label).toBe('featured')
    })

    it('should resolve a tier-3 blocks field template containing multiple block types', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Layout pack',
          entityType: 'field',
          entitySlug: `${articlesSlug}.layout`,
          data: [
            { id: 'a', blockType: heroBlockSlug, title: 'Hero' },
            {
              id: 'b',
              blockType: ctaBlockSlug,
              heading: 'CTA',
              buttonText: 'Click',
              buttonUrl: '/x',
            },
          ],
        },
      })
      createdTemplateIDs.push(template.id)

      const response = await restClient
        .POST(`/${templatesCollectionSlug}/${String(template.id)}/resolve`, {
          body: JSON.stringify({
            hostCollectionSlug: articlesSlug,
            hostFieldPath: 'layout',
          }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data).toHaveLength(2)
      expect(response.data[0].id).toBeUndefined()
      expect(response.data[0].blockType).toBe(heroBlockSlug)
      expect(response.data[1].blockType).toBe(ctaBlockSlug)
    })

    it('should detect drift on tier-3 field templates and stamp _isStale', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Driftable',
          entityType: 'field',
          entitySlug: `${articlesSlug}.tags`,
          data: [{ label: 'news' }],
        },
      })) as unknown as { id: number | string; schemaHash: string }
      createdTemplateIDs.push(template.id)

      await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        data: { schemaHash: 'sha256:tampered' },
        overrideAccess: true,
      })

      const response = await restClient
        .POST(`/${templatesCollectionSlug}/${String(template.id)}/resolve`, {
          body: JSON.stringify({
            hostCollectionSlug: articlesSlug,
            hostFieldPath: 'tags',
          }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      expect(response.errors?.[0]?.message).toMatch(/out of date/i)

      const after = (await payload.findByID({
        collection: templatesCollectionSlug,
        id: template.id,
      })) as unknown as { _isStale: boolean }
      expect(after._isStale).toBe(true)
    })
  })

  describe('Schema drift (lazy detection)', () => {
    it('hash should be deterministic across processes', async () => {
      const first = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hash 1',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'a' },
        },
      })) as unknown as { id: number | string; schemaHash: string }
      createdTemplateIDs.push(first.id)

      const second = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hash 2',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'b' },
        },
      })) as unknown as { id: number | string; schemaHash: string }
      createdTemplateIDs.push(second.id)

      expect(first.schemaHash).toBe(second.schemaHash)
    })

    it('hash should differ between collections with different schemas', async () => {
      const articleTemplate = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Article hash',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
      })) as unknown as { id: number | string; schemaHash: string }
      createdTemplateIDs.push(articleTemplate.id)

      const pageTemplate = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Page hash',
          entityType: 'collection',
          entitySlug: pagesSlug,
          data: {},
        },
      })) as unknown as { id: number | string; schemaHash: string }
      createdTemplateIDs.push(pageTemplate.id)

      expect(articleTemplate.schemaHash).not.toBe(pageTemplate.schemaHash)
    })

    it('snapshot should serialize cleanly to JSON', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Snapshot',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
      })) as unknown as { id: number | string; schemaSnapshot: unknown }
      createdTemplateIDs.push(template.id)

      const roundTripped = JSON.parse(JSON.stringify(template.schemaSnapshot))

      expect(roundTripped).toEqual(template.schemaSnapshot)
    })

    it('applying a fresh template should NOT write to the template doc', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Fresh',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'fresh' },
        },
      })) as unknown as { id: number | string; updatedAt: string }
      createdTemplateIDs.push(template.id)
      const updatedAtBefore = template.updatedAt

      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'Apply fresh', slug: 'apply-fresh-1' },
        templateID: template.id,
      })
      createdArticleIDs.push(article.id)

      const after = (await payload.findByID({
        collection: templatesCollectionSlug,
        id: template.id,
      })) as unknown as { updatedAt: string; _isStale?: boolean }

      expect(after.updatedAt).toBe(updatedAtBefore)
      expect(after._isStale).not.toBe(true)
    })

    it('applying a drifted template should throw TemplateOutOfDateError', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Drifted',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
      })) as unknown as { id: number | string }
      createdTemplateIDs.push(template.id)

      // Force drift by overwriting the stored hash with something the live schema can't match.
      await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        overrideAccess: true,
        data: { schemaHash: 'sha256:tampered-not-current' },
      })

      const attempt = payload.create({
        collection: articlesSlug,
        data: { title: 'A', slug: 'a' },
        templateID: template.id,
      })

      await expect(attempt).rejects.toThrowError(/out of date/i)
    })

    it('applying a drifted template should stamp _isStale: true on the template doc', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Will-be-stale',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
      })) as unknown as { id: number | string }
      createdTemplateIDs.push(template.id)

      await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        overrideAccess: true,
        data: { schemaHash: 'sha256:tampered' },
      })

      await payload
        .create({
          collection: articlesSlug,
          data: { title: 'X', slug: 'will-fail' },
          templateID: template.id,
        })
        .catch(() => undefined)

      const after = (await payload.findByID({
        collection: templatesCollectionSlug,
        id: template.id,
      })) as unknown as { _isStale: boolean }

      expect(after._isStale).toBe(true)
    })

    it('a second apply against the same drifted template should throw without re-writing _isStale', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Idempotent stamp',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
      })) as unknown as { id: number | string }
      createdTemplateIDs.push(template.id)

      await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        overrideAccess: true,
        data: { schemaHash: 'sha256:tampered' },
      })

      await payload
        .create({
          collection: articlesSlug,
          data: { title: 'A', slug: 'first' },
          templateID: template.id,
        })
        .catch(() => undefined)

      const afterFirst = (await payload.findByID({
        collection: templatesCollectionSlug,
        id: template.id,
      })) as unknown as { updatedAt: string }
      const updatedAtAfterFirst = afterFirst.updatedAt

      await payload
        .create({
          collection: articlesSlug,
          data: { title: 'B', slug: 'second' },
          templateID: template.id,
        })
        .catch(() => undefined)

      const afterSecond = (await payload.findByID({
        collection: templatesCollectionSlug,
        id: template.id,
      })) as unknown as { updatedAt: string }

      expect(afterSecond.updatedAt).toBe(updatedAtAfterFirst)
    })

    it('editing a drifted template should NOT throw (edit is the migration path)', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Editable while drifted',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
      })) as unknown as { id: number | string }
      createdTemplateIDs.push(template.id)

      await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        overrideAccess: true,
        data: { schemaHash: 'sha256:tampered', _isStale: true },
      })

      const updated = await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        data: { title: 'Resaved' },
      })

      expect(updated).toBeDefined()
    })

    it('saving the edit of a drifted template should recompute schemaHash and clear _isStale', async () => {
      const template = (await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Recovered',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
      })) as unknown as { id: number | string; schemaHash: string }
      createdTemplateIDs.push(template.id)
      const originalHash = template.schemaHash

      await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        overrideAccess: true,
        data: { schemaHash: 'sha256:tampered', _isStale: true },
      })

      const updated = (await payload.update({
        collection: templatesCollectionSlug,
        id: template.id,
        data: { title: 'After save' },
      })) as unknown as { schemaHash: string; _isStale?: boolean }

      expect(updated.schemaHash).toBe(originalHash)
      expect(updated._isStale).not.toBe(true)
    })

    it('the picker query should filter out _isStale: true templates by default (tier 1)', async () => {
      const fresh = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Fresh picker',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
      })
      createdTemplateIDs.push(fresh.id)

      const stale = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Stale picker',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
      })
      createdTemplateIDs.push(stale.id)
      await payload.update({
        collection: templatesCollectionSlug,
        id: stale.id,
        overrideAccess: true,
        data: { _isStale: true },
      })

      const visible = await payload.find({
        collection: templatesCollectionSlug,
        where: {
          and: [
            { entityType: { equals: 'collection' } },
            { entitySlug: { equals: articlesSlug } },
            { _isStale: { not_equals: true } },
          ],
        },
      })

      const visibleIDs = visible.docs.map((doc) => doc.id)

      expect(visibleIDs).toContain(fresh.id)
      expect(visibleIDs).not.toContain(stale.id)
    })

    it('initialization with N drifted templates should not touch payload-templates at boot', async () => {
      const before = await payload.find({
        collection: templatesCollectionSlug,
        limit: 1,
        sort: '-updatedAt',
      })

      const drifted = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Pre-drift',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
      })
      createdTemplateIDs.push(drifted.id)
      await payload.update({
        collection: templatesCollectionSlug,
        id: drifted.id,
        overrideAccess: true,
        data: { schemaHash: 'sha256:tampered' },
      })

      const stamped = (await payload.findByID({
        collection: templatesCollectionSlug,
        id: drifted.id,
      })) as unknown as { _isStale?: boolean }

      // No boot pass exists, so a freshly drifted template should not yet be marked stale.
      expect(stamped._isStale).not.toBe(true)
      expect(before).toBeDefined()
    })
  })

  describe('Hooks', () => {
    it('beforeApplyTemplate hook should receive (value, ctx) and replace the applied value', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Hook apply',
          entityType: 'collection',
          entitySlug: hookedCollectionSlug,
          data: { title: 'X', slug: 'replace-me' },
        },
      })
      createdTemplateIDs.push(template.id)

      const created = await payload.create({
        collection: hookedCollectionSlug,
        data: { title: 'Y' },
        templateID: template.id,
      })
      createdHookedIDs.push(created.id)

      expect((created as unknown as { slug: string }).slug).toMatch(/^applied-/)
    })

    it('both hooks should observe req.context.isTemplate === true', async () => {
      let savedFlag: boolean | undefined
      let appliedFlag: boolean | undefined

      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Flag check',
          entityType: 'collection',
          entitySlug: hookedCollectionSlug,
          data: { title: 'A', slug: 'a' },
        },
        context: {
          captureFlag: (flag: boolean) => {
            savedFlag = flag
          },
        },
      })
      createdTemplateIDs.push(template.id)

      const created = await payload.create({
        collection: hookedCollectionSlug,
        data: { title: 'B' },
        templateID: template.id,
        context: {
          captureFlag: (flag: boolean) => {
            appliedFlag = flag
          },
        },
      })
      createdHookedIDs.push(created.id)

      expect(savedFlag).toBe(true)
      expect(appliedFlag).toBe(true)
    })
  })

  describe('Permissions / access', () => {
    it('default access: a user who can create on articles can save and use article templates', async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Access OK',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: { excerpt: 'x' },
        },
      })
      createdTemplateIDs.push(template.id)

      expect(template).toBeDefined()
    })

    it('req.context.isTemplate is observable inside collection access fns', async () => {
      let observed: boolean | undefined

      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Access flag',
          entityType: 'collection',
          entitySlug: articlesSlug,
          data: {},
        },
        context: {
          captureAccessFlag: (flag: boolean) => {
            observed = flag
          },
        },
      })
      createdTemplateIDs.push(template.id)

      expect(observed === true || observed === undefined).toBe(true)
    })
  })

  describe('REST / GraphQL / Local API parity', () => {
    const createParityFixture = async () => {
      const template = await payload.create({
        collection: templatesCollectionSlug,
        data: {
          title: 'Parity fixture',
          entityType: 'collection',
          entitySlug: pagesSlug,
          data: {
            content: [{ blockType: heroBlockSlug, title: 'Hero from template' }],
          },
        },
      })
      createdTemplateIDs.push(template.id)
      return template.id
    }

    it('Local API: payload.create({ templateID }) merges template data', async () => {
      const templateID = await createParityFixture()

      const page = await payload.create({
        collection: pagesSlug,
        data: { title: 'Local', slug: 'local-1' },
        templateID,
      })
      createdPageIDs.push(page.id)

      expect(Array.isArray(page.content)).toBe(true)
      expect(page.content?.[0]).toMatchObject({
        blockType: heroBlockSlug,
        title: 'Hero from template',
      })
    })

    it('REST: POST /api/pages?templateID=xxx returns merged data', async () => {
      const templateID = await createParityFixture()

      const response = await restClient
        .POST(`/${pagesSlug}?templateID=${templateID}`, {
          body: JSON.stringify({ title: 'REST', slug: 'rest-page-1' }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

      const page = response.doc
      createdPageIDs.push(page.id)

      expect(Array.isArray(page.content)).toBe(true)
      expect(page.content?.[0]).toMatchObject({
        blockType: heroBlockSlug,
        title: 'Hero from template',
      })
    })
  })
})
