import { expect } from 'vitest'

import type { RestoreRichText } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import {
  restoreLocalizedGroupSlug,
  restoreLocalizedTabSlug,
  restoreRequiredContainersSlug,
  restoreRichTextSlug,
} from './slugs.js'

test.suite('Restore localized collection versions', { config: './config.ts' }, () => {
  for (const collection of [restoreLocalizedGroupSlug, restoreLocalizedTabSlug] as const) {
    test(`should restore a required title inside ${collection} from the stored locale`, async ({
      payload,
    }) => {
      const post = await payload.create({
        collection,
        data: { content: { title: 'Original title' } },
        fallbackLocale: false,
        locale: 'de',
        overrideAccess: true,
      })

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

  const emptyContainerCases = [
    {
      field: 'items',
      data: { items: [], sections: [{ blockType: 'section' as const, text: 'Content' }] },
    },
    { field: 'sections', data: { items: [{ text: 'Content' }], sections: [] } },
  ]

  for (const { data, field } of emptyContainerCases) {
    test(`should reject a validated restore when the required ${field} field is empty`, async ({
      payload,
    }) => {
      const collection = restoreRequiredContainersSlug
      const post = await payload.create({
        collection,
        data: { ...data, title: 'German title' },
        draft: true,
        locale: 'de',
        overrideAccess: true,
      })

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

  test('should preserve localized array fallback during an ordinary update', async ({
    payload,
  }) => {
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

  test('should restore a required Lexical field when only the non-default locale contains text', async ({
    payload,
  }) => {
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
