import type { CollectionSlug, Payload } from 'payload'

import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { RestoreRichText } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  restoreConditionalGroupSlug,
  restoreLocalizedArrayRowsSlug,
  restoreLocalizedGroupSlug,
  restoreLocalizedTabSlug,
  restoreNonLocalizedConditionSlug,
  restorePointConditionSlug,
  restoreRequiredContainersSlug,
  restoreRichTextSlug,
} from './slugs.js'

describe('Restore localized collection versions', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number | string }[] = []

  beforeAll(async () => {
    const testDir = fileURLToPath(new URL('.', import.meta.url))
    ;({ payload } = await initPayloadInt(testDir))
  })

  afterEach(async () => {
    for (const { id, collection } of created) {
      await payload.delete({ id, collection, overrideAccess: true })
    }
    created.length = 0
  })

  afterAll(async () => {
    await payload?.destroy()
  })

  for (const collection of [restoreLocalizedGroupSlug, restoreLocalizedTabSlug] as const) {
    it(`should restore a required title inside ${collection} from the stored locale`, async () => {
      const post = await payload.create({
        collection,
        data: { content: { title: 'Original title' } },
        fallbackLocale: false,
        locale: 'de',
        overrideAccess: true,
      })

      created.push({ id: post.id, collection })

      const [version] = (
        await payload.findVersions({
          collection,
          overrideAccess: true,
          where: { parent: { equals: post.id } },
        })
      ).docs

      await payload.update({
        id: post.id,
        collection,
        data: { content: { title: 'Updated title' } },
        locale: 'de',
        overrideAccess: true,
      })

      await payload.restoreVersion({ id: version!.id, collection, overrideAccess: true })

      const restored = await payload.findByID({
        id: post.id,
        collection,
        locale: 'all',
        overrideAccess: true,
      })

      expect(restored).toMatchObject({ content: { de: { title: 'Original title' } } })
      expect(restored.content).not.toHaveProperty('en.title', expect.anything())
    })
  }

  it('should keep the default locale when its required field is hidden by a condition', async () => {
    const collection = restoreLocalizedGroupSlug
    const post = await payload.create({
      collection,
      data: { content: { enabled: false, title: '' } },
      locale: 'en',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    const [version] = (
      await payload.findVersions({
        collection,
        locale: 'all',
        overrideAccess: true,
        where: { parent: { equals: post.id } },
      })
    ).docs

    // The secondary translation was stored before the current minimum length applied.
    const historicalContent = {
      de: { enabled: true, title: 'x' },
      en: { enabled: false, title: '' },
    }

    await payload.db.updateVersion({
      id: version!.id,
      collection,
      locale: 'all',
      returning: false,
      versionData: { version: { ...version!.version, content: historicalContent } },
    })

    const snapshot = await payload.findVersionByID({
      id: version!.id,
      collection,
      locale: 'all',
      overrideAccess: true,
    })

    expect(snapshot).toMatchObject({ version: { content: historicalContent } })

    await payload.update({
      id: post.id,
      collection,
      data: { content: { enabled: true, title: 'Current title' } },
      locale: 'en',
      overrideAccess: true,
    })

    await payload.restoreVersion({ id: version!.id, collection, overrideAccess: true })

    const restored = await payload.findByID({
      id: post.id,
      collection,
      locale: 'all',
      overrideAccess: true,
    })

    expect(restored).toMatchObject({ content: historicalContent })
  })

  it('should use the localized document and indexed block path for a field condition', async () => {
    const collection = restoreLocalizedGroupSlug
    const post = await payload.create({
      collection,
      data: {
        content: { enabled: false, title: 'English title' },
        sections: [
          { blockType: 'conditional-section', caption: 'First caption', enabled: true },
          { blockType: 'conditional-section', caption: 'Second caption', enabled: false },
        ],
      },
      locale: 'en',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    const [version] = (
      await payload.findVersions({
        collection,
        locale: 'all',
        overrideAccess: true,
        where: { parent: { equals: post.id } },
      })
    ).docs

    const historicalSections = version!.version.sections!.map((section, index) => ({
      ...section,
      caption: index === 1 ? { de: 'x', en: '' } : { de: 'German caption', en: 'First caption' },
    }))

    await payload.db.updateVersion({
      id: version!.id,
      collection,
      locale: 'all',
      returning: false,
      versionData: {
        version: {
          ...version!.version,
          content: {
            de: { enabled: true, title: 'German title' },
            en: { enabled: false, title: 'English title' },
          },
          sections: historicalSections,
        },
      },
    })

    const restored = await payload.restoreVersion({
      id: version!.id,
      collection,
      overrideAccess: true,
    })

    expect(restored.sections).toMatchObject([{ caption: 'First caption' }, { caption: '' }])
  })

  it('should restore a locale with a required field inside an inactive parent group', async () => {
    const collection = restoreConditionalGroupSlug
    const post = await payload.create({
      collection,
      data: {
        content: { details: { advanced: { title: 'English title' }, enabled: true } },
        heading: 'English heading',
      },
      locale: 'en',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    const [version] = (
      await payload.findVersions({
        collection,
        locale: 'all',
        overrideAccess: true,
        where: { parent: { equals: post.id } },
      })
    ).docs

    const content = {
      de: { details: { advanced: { title: '' }, enabled: false } },
      en: { details: { advanced: { title: 'English title' }, enabled: true } },
    }
    const heading = { de: 'German heading', en: '' }

    await payload.db.updateVersion({
      id: version!.id,
      collection,
      locale: 'all',
      returning: false,
      versionData: { version: { ...version!.version, content, heading } },
    })

    const restoreOptions = {
      id: version!.id,
      collection,
      locale: 'all' as const,
      overrideAccess: true,
    }
    const restored = await payload.restoreVersion(restoreOptions)

    expect(restored).toMatchObject({ content, heading })

    await payload.db.updateVersion({
      id: version!.id,
      collection,
      locale: 'all',
      returning: false,
      versionData: {
        version: {
          ...version!.version,
          content: { ...content, de: { details: { ...content.de.details, enabled: true } } },
          heading,
        },
      },
    })

    await expect(payload.restoreVersion(restoreOptions)).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'heading' })] },
    })
  })

  it('should pass the validation locale to both preliminary afterRead hooks', async () => {
    const collection = restoreLocalizedTabSlug
    const post = await payload.create({
      collection,
      data: { content: { title: 'Original title' } },
      locale: 'de',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    const [version] = (
      await payload.findVersions({
        collection,
        overrideAccess: true,
        where: { parent: { equals: post.id } },
      })
    ).docs

    await payload.update({
      id: post.id,
      collection,
      data: { content: { title: 'Current title' } },
      locale: 'de',
      overrideAccess: true,
    })

    const restoreReadLocales: { locale?: string; value: unknown }[] = []
    const restored = await payload.restoreVersion({
      id: version!.id,
      collection,
      context: { restoreReadLocales },
      fallbackLocale: 'de',
      locale: 'en',
      overrideAccess: true,
    })

    expect(restoreReadLocales).toEqual([
      { locale: 'de', value: 'Current title' },
      { locale: 'de', value: 'Original title' },
      { locale: 'en', value: 'Original title' },
    ])
    expect(restored.content?.title).toBe('Original title')
  })

  it('should check required fields in every active localized array row', async () => {
    const collection = restoreLocalizedArrayRowsSlug
    const post = await payload.create({
      collection,
      data: { content: { rows: [{ enabled: true, title: 'English title' }] } },
      locale: 'en',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    const [version] = (
      await payload.db.findVersions({
        collection,
        locale: 'all',
        where: { parent: { equals: post.id } },
      })
    ).docs

    const content = {
      de: {
        rows: [
          { enabled: false, title: '' },
          { enabled: true, title: 'German title' },
        ],
      },
      en: {
        rows: [
          { enabled: true, title: 'English title' },
          { enabled: true, title: '' },
        ],
      },
    }

    await payload.db.updateVersion({
      id: version!.id,
      collection,
      locale: 'all',
      returning: false,
      versionData: { version: { ...version!.version, content } },
    })

    const restored = await payload.restoreVersion({
      id: version!.id,
      collection,
      locale: 'all',
      overrideAccess: true,
    })

    expect(restored).toMatchObject({ content })

    // An empty optional array adds no validation requirements for the default locale.
    await payload.db.updateVersion({
      id: version!.id,
      collection,
      locale: 'all',
      returning: false,
      versionData: {
        version: {
          ...version!.version,
          content: { de: { rows: [{ enabled: true, title: 'x' }] }, en: { rows: [] } },
        },
      },
    })

    await payload.restoreVersion({ id: version!.id, collection, overrideAccess: true })
  })

  for (const isNested of [false, true]) {
    const location = isNested ? 'blocks nested in a localized array' : 'localized block rows'
    it(`should check required fields in ${location}`, async () => {
      const collection = restoreLocalizedArrayRowsSlug
      const hiddenBlock = {
        blockType: 'required-caption' as const,
        details: { caption: '' },
        enabled: false,
      }
      const activeBlock = {
        blockType: 'required-caption' as const,
        details: { caption: 'German caption' },
        enabled: true,
      }
      const en = [hiddenBlock, { ...activeBlock, details: { caption: '' } }]
      const de = [hiddenBlock, activeBlock]

      const post = await payload.create({
        collection,
        data: isNested ? { items: [{ sections: [activeBlock] }] } : { sections: [activeBlock] },
        locale: 'en',
        overrideAccess: true,
      })

      created.push({ id: post.id, collection })

      const [version] = (
        await payload.db.findVersions({
          collection,
          locale: 'all',
          where: { parent: { equals: post.id } },
        })
      ).docs

      const historicalData = isNested
        ? { items: { de: [{ sections: de }], en: [{ sections: en }] } }
        : { sections: { de, en } }

      await payload.db.updateVersion({
        id: version!.id,
        collection,
        locale: 'all',
        returning: false,
        versionData: { version: { ...version!.version, ...historicalData } },
      })

      const [snapshot] = (
        await payload.db.findVersions({
          collection,
          locale: 'all',
          where: { id: { equals: version!.id } },
        })
      ).docs

      expect(snapshot?.version).toMatchObject(historicalData)

      const restored = await payload.restoreVersion({
        id: version!.id,
        collection,
        locale: 'all',
        overrideAccess: true,
      })

      expect(restored).toMatchObject(historicalData)
    })
  }

  it('should use point coordinates when evaluating a field condition for locale selection', async () => {
    const collection = restorePointConditionSlug
    const post = await payload.create({
      collection,
      data: { origin: [1, 2], title: 'English title' },
      locale: 'en',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    const [version] = (
      await payload.db.findVersions({
        collection,
        locale: 'all',
        where: { parent: { equals: post.id } },
      })
    ).docs

    expect(version!.version.origin).toMatchObject({ coordinates: [1, 2] })

    const title = { de: 'German title', en: '' }
    await payload.db.updateVersion({
      id: version!.id,
      collection,
      locale: 'all',
      returning: false,
      versionData: { version: { ...version!.version, title } },
    })

    const restored = await payload.restoreVersion({
      id: version!.id,
      collection,
      locale: 'all',
      overrideAccess: true,
    })

    expect(restored).toMatchObject({ origin: [1, 2], title })
  })

  const containerConditionCases = [
    {
      enabledInEnglish: false,
      entries: [],
      germanTitle: 'x',
      name: 'honor a condition above a localized field',
    },
    {
      enabledInEnglish: true,
      entries: null,
      germanTitle: 'German title',
      name: 'evaluate conditions with the read shape of an empty array',
    },
  ]

  for (const { enabledInEnglish, entries, germanTitle, name } of containerConditionCases) {
    it(`should ${name}`, async () => {
      const collection = restoreNonLocalizedConditionSlug
      const post = await payload.create({
        collection,
        data: { content: { title: 'English title' }, enabled: true },
        locale: 'en',
        overrideAccess: true,
      })

      created.push({ id: post.id, collection })

      const [version] = (
        await payload.db.findVersions({
          collection,
          locale: 'all',
          where: { parent: { equals: post.id } },
        })
      ).docs

      const content = { title: { de: germanTitle, en: '' } }
      const enabled = { de: true, en: enabledInEnglish }
      const historicalVersion = { ...version!.version, content, enabled, entries }

      await payload.db.updateVersion({
        id: version!.id,
        collection,
        locale: 'all',
        returning: false,
        versionData: { version: historicalVersion },
      })

      const snapshot = await payload.db.findVersions({
        collection,
        locale: 'all',
        where: { id: { equals: version!.id } },
      })

      // Some adapters materialize absent arrays as an empty array before field reads.
      const readVersion = vi.spyOn(payload.db, 'findVersions').mockResolvedValueOnce({
        ...snapshot,
        docs: snapshot.docs.map((doc) => ({ ...doc, version: { ...doc.version, entries } })),
      })

      try {
        const restored = await payload.restoreVersion({
          id: version!.id,
          collection,
          locale: 'all',
          overrideAccess: true,
        })

        expect(restored).toMatchObject({ content, enabled })
      } finally {
        readVersion.mockRestore()
      }
    })
  }

  const emptyContainerCases = [
    {
      field: 'items',
      data: { items: [], sections: [{ blockType: 'section' as const, text: 'Content' }] },
    },
    { field: 'sections', data: { items: [{ text: 'Content' }], sections: [] } },
  ]

  for (const { data, field } of emptyContainerCases) {
    it(`should reject a validated restore when the required ${field} field is empty`, async () => {
      const collection = restoreRequiredContainersSlug
      const post = await payload.create({
        collection,
        data: { ...data, title: 'German title' },
        draft: true,
        locale: 'de',
        overrideAccess: true,
      })

      created.push({ id: post.id, collection })

      const [version] = (
        await payload.findVersions({
          collection,
          overrideAccess: true,
          where: { parent: { equals: post.id } },
        })
      ).docs

      await expect(
        payload.restoreVersion({ id: version!.id, collection, overrideAccess: true }),
      ).rejects.toMatchObject({ data: { errors: [expect.objectContaining({ path: field })] } })
    })
  }

  it('should preserve localized array fallback during an ordinary update', async () => {
    const collection = restoreRequiredContainersSlug
    const post = await payload.create({
      collection,
      data: {
        items: [{ text: 'English item' }],
        sections: [{ blockType: 'section', text: 'English section' }],
        title: 'English title',
      },
      locale: 'en',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    await payload.update({
      id: post.id,
      collection,
      data: {
        sections: [{ blockType: 'section', text: 'German section' }],
        title: 'German title',
      },
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: true,
    })

    const updated = await payload.findByID({
      id: post.id,
      collection,
      locale: 'all',
      overrideAccess: true,
    })

    expect(updated).toMatchObject({
      items: { en: [expect.objectContaining({ text: 'English item' })] },
      title: { de: 'German title', en: 'English title' },
    })
  })

  it('should restore a required Lexical field when only the non-default locale contains text', async () => {
    const collection = restoreRichTextSlug
    const empty = lexicalParagraph({})
    const translated = lexicalParagraph({ text: 'German body' })
    const post = await payload.create({
      collection,
      data: { body: empty },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })

    created.push({ id: post.id, collection })

    await payload.update({
      id: post.id,
      collection,
      data: { body: translated },
      draft: true,
      locale: 'de',
      overrideAccess: true,
    })

    const { docs: versions } = await payload.findVersions({
      collection,
      locale: 'all',
      overrideAccess: true,
      where: { parent: { equals: post.id } },
    })

    const bilingualVersion = versions.find(
      ({ version }) => version.body && 'de' in version.body && 'en' in version.body,
    )

    expect(bilingualVersion?.version.body).toEqual({ de: translated, en: empty })

    await payload.restoreVersion({ id: bilingualVersion!.id, collection, overrideAccess: true })

    const restored = await payload.findByID({
      id: post.id,
      collection,
      locale: 'all',
      overrideAccess: true,
    })

    expect(restored.body).toEqual({ de: translated, en: empty })
  })
})

function lexicalParagraph({ text }: { text?: string }): RestoreRichText['body'] {
  return {
    root: {
      children: [
        {
          children: text
            ? [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }]
            : [],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}
