import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { localizedCollectionSlug, localizedGlobalSlug } from './slugs.js'

let payload: Payload

const collection = localizedCollectionSlug
const global = localizedGlobalSlug

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Versions', () => {
  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Collections', () => {
    let postID: string

    beforeEach(async () => {
      await payload.delete({
        collection,
        where: {},
      })
    })

    it('should save correct doc data when publishing individual locale', async () => {
      // save spanish draft
      const draft1 = await payload.create({
        collection,
        data: {
          text: 'Spanish draft',
        },
        draft: true,
        locale: 'es',
      })

      postID = draft1.id as any

      // save english draft
      const draft2 = await payload.update({
        id: postID,
        collection,
        data: {
          text: 'English draft',
          description: 'My English description',
        },
        draft: true,
        locale: 'en',
      })

      // save german draft
      const draft3 = await payload.update({
        id: postID,
        collection,
        data: {
          text: 'German draft',
        },
        draft: true,
        locale: 'de',
      })

      // publish only english
      const publishedEN1 = await payload.update({
        id: postID,
        collection,
        data: {
          text: 'English published 1',
          _status: 'published',
        },
        draft: false,
        locale: 'en',
        publishSpecificLocale: 'en',
      })

      const docWithoutSpanishDraft = await payload.findByID({
        collection,
        id: postID,
        locale: 'all',
      })

      // We're getting the published version,
      // which should not leak any unpublished Spanish content
      // and should retain the English fields that were not explicitly
      // passed in from publishedEN1
      expect(docWithoutSpanishDraft.text.es).toBeUndefined()
      expect(docWithoutSpanishDraft.description.en).toStrictEqual('My English description')

      const docWithSpanishDraft1 = await payload.findByID({
        collection,
        id: postID,
        locale: 'all',
        draft: true,
      })

      // After updating English via specific locale,
      // We should expect to see that Spanish translations were maintained
      expect(docWithSpanishDraft1.text.es).toStrictEqual('Spanish draft')
      expect(docWithSpanishDraft1.text.en).toStrictEqual('English published 1')
      expect(docWithSpanishDraft1.description.en).toStrictEqual('My English description')

      const publishedEN2 = await payload.update({
        id: postID,
        collection,
        data: {
          text: 'English published 2',
          _status: 'published',
        },
        draft: false,
        locale: 'en',
        publishSpecificLocale: 'en',
      })

      const docWithoutSpanishDraft2 = await payload.findByID({
        collection,
        id: postID,
        locale: 'all',
      })

      // On the second consecutive publish of a specific locale,
      // Make sure we maintain draft data that has never been published
      // even after two + consecutive publish events
      expect(docWithoutSpanishDraft2.text.es).toBeUndefined()
      expect(docWithoutSpanishDraft2.text.en).toStrictEqual('English published 2')
      expect(docWithoutSpanishDraft2.description.en).toStrictEqual('My English description')

      await payload.update({
        id: postID,
        collection,
        data: {
          text: 'German draft 1',
          _status: 'draft',
        },
        draft: true,
        locale: 'de',
      })

      const docWithGermanDraft = await payload.findByID({
        collection,
        id: postID,
        locale: 'all',
        draft: true,
      })

      // Make sure we retain the Spanish draft,
      // which may be lost when we create a new draft with German.
      // Update operation should fetch both draft locales as well as published
      // and merge them.
      expect(docWithGermanDraft.text.de).toStrictEqual('German draft 1')
      expect(docWithGermanDraft.text.es).toStrictEqual('Spanish draft')
      expect(docWithGermanDraft.text.en).toStrictEqual('English published 2')

      const publishedDE = await payload.update({
        id: postID,
        collection,
        data: {
          _status: 'published',
          text: 'German published 1',
        },
        draft: false,
        locale: 'de',
        publishSpecificLocale: 'de',
      })

      const publishedENFinal = await payload.update({
        id: postID,
        collection,
        data: {
          text: 'English published 3',
          _status: 'published',
        },
        draft: false,
        locale: 'en',
        publishSpecificLocale: 'en',
      })

      const finalPublishedNoES = await payload.findByID({
        collection,
        id: postID,
        locale: 'all',
      })

      expect(finalPublishedNoES.text.de).toStrictEqual('German published 1')
      expect(finalPublishedNoES.text.en).toStrictEqual('English published 3')
      expect(finalPublishedNoES.text.es).toBeUndefined()

      const finalDraft = await payload.findByID({
        collection,
        id: postID,
        locale: 'all',
        draft: true,
      })

      expect(finalDraft.text.de).toStrictEqual('German published 1')
      expect(finalDraft.text.en).toStrictEqual('English published 3')
      expect(finalDraft.text.es).toStrictEqual('Spanish draft')

      const published = await payload.update({
        collection,
        id: postID,
        data: {
          _status: 'published',
        },
      })

      const finalPublished = await payload.findByID({
        collection,
        id: postID,
        locale: 'all',
        draft: true,
      })

      expect(finalPublished.text.de).toStrictEqual('German published 1')
      expect(finalPublished.text.en).toStrictEqual('English published 3')
      expect(finalPublished.text.es).toStrictEqual('Spanish draft')
    })

    it('should not leak draft data', async () => {
      const draft = await payload.create({
        collection,
        data: {
          text: 'Spanish draft',
        },
        draft: true,
        locale: 'es',
      })

      const published = await payload.update({
        id: draft.id,
        collection,
        data: {
          text: 'English publish',
          _status: 'published',
        },
        draft: false,
        publishSpecificLocale: 'en',
      })

      const publishedOnlyEN = await payload.findByID({
        collection,
        id: draft.id,
        locale: 'all',
      })

      expect(publishedOnlyEN.text.es).toBeUndefined()
      expect(publishedOnlyEN.text.en).toStrictEqual('English publish')
    })

    it('should merge draft data from other locales when publishing all', async () => {
      const draft = await payload.create({
        collection,
        data: {
          text: 'Spanish draft',
        },
        draft: true,
        locale: 'es',
      })

      const published = await payload.update({
        id: draft.id,
        collection,
        data: {
          text: 'English publish',
          _status: 'published',
        },
        draft: false,
        publishSpecificLocale: 'en',
      })

      const publishedOnlyEN = await payload.findByID({
        collection,
        id: draft.id,
        locale: 'all',
      })

      expect(publishedOnlyEN.text.es).toBeUndefined()
      expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

      const published2 = await payload.update({
        id: draft.id,
        collection,
        data: {
          _status: 'published',
        },
        draft: false,
      })

      const publishedAll = await payload.findByID({
        collection,
        id: published2.id,
        locale: 'all',
      })

      expect(publishedAll.text.es).toStrictEqual('Spanish draft')
      expect(publishedAll.text.en).toStrictEqual('English publish')
    })

    it('should publish non-default individual locale', async () => {
      const draft = await payload.create({
        collection,
        data: {
          text: 'Spanish draft',
        },
        draft: true,
        locale: 'es',
      })

      const published = await payload.update({
        id: draft.id,
        collection,
        data: {
          text: 'German publish',
          _status: 'published',
        },
        draft: false,
        publishSpecificLocale: 'de',
      })

      const publishedOnlyDE = await payload.findByID({
        collection,
        id: published.id,
        locale: 'all',
      })

      expect(publishedOnlyDE.text.es).toBeUndefined()
      expect(publishedOnlyDE.text.en).toBeUndefined()
      expect(publishedOnlyDE.text.de).toStrictEqual('German publish')
    })

    it('should show correct data in latest version', async () => {
      const draft = await payload.create({
        collection,
        data: {
          text: 'Spanish draft',
        },
        draft: true,
        locale: 'es',
      })

      const published = await payload.update({
        id: draft.id,
        collection,
        data: {
          text: 'English publish',
          _status: 'published',
        },
        draft: false,
        publishSpecificLocale: 'en',
      })

      const publishedOnlyEN = await payload.findByID({
        collection,
        id: published.id,
        locale: 'all',
      })

      expect(publishedOnlyEN.text.es).toBeUndefined()
      expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

      const allVersions = await payload.findVersions({
        collection,
        locale: 'all',
      })

      const versions = allVersions.docs.filter((version) => version.parent === published.id)
      const latestVersion = versions[0].version

      expect(latestVersion.text.es).toBeUndefined()
      expect(latestVersion.text.en).toStrictEqual('English publish')
    })
  })

  describe('Globals', () => {
    it('should save correct global data when publishing individual locale', async () => {
      // publish german
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'German published',
          _status: 'published',
        },
        locale: 'de',
      })

      // save spanish draft
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'Spanish draft',
          content: 'Spanish draft content',
        },
        draft: true,
        locale: 'es',
      })

      // publish only english
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'Eng published',
          _status: 'published',
        },
        locale: 'en',
        publishSpecificLocale: 'en',
      })

      const globalData = await payload.findGlobal({
        slug: global,
        locale: 'all',
      })

      // Expect only previously published data to be present
      expect(globalData.title.es).toBeUndefined()
      expect(globalData.title.en).toStrictEqual('Eng published')
      expect(globalData.title.de).toStrictEqual('German published')
    })

    it('should not leak draft data', async () => {
      // save spanish draft
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'Another spanish draft',
        },
        draft: true,
        locale: 'es',
      })

      // publish only english
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'Eng published',
          _status: 'published',
        },
        draft: false,
        locale: 'en',
        publishSpecificLocale: 'en',
      })

      const globalData = await payload.findGlobal({
        slug: global,
        locale: 'all',
      })

      // Expect no draft data to be present
      expect(globalData.title.es).toBeUndefined()
      expect(globalData.title.en).toStrictEqual('Eng published')
    })

    it('should merge draft data from other locales when publishing all', async () => {
      // save spanish draft
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'Spanish draft',
          content: 'Spanish draft content',
        },
        draft: true,
        locale: 'es',
      })

      // publish only english
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'Eng published',
          _status: 'published',
        },
        locale: 'en',
        publishSpecificLocale: 'en',
      })

      const publishedOnlyEN = await payload.findGlobal({
        slug: global,
        locale: 'all',
      })

      expect(publishedOnlyEN.title.es).toBeUndefined()
      expect(publishedOnlyEN.title.en).toStrictEqual('Eng published')

      await payload.updateGlobal({
        slug: global,
        data: {
          _status: 'published',
        },
      })

      const publishedAll = await payload.findGlobal({
        slug: global,
        locale: 'all',
      })

      expect(publishedAll.title.es).toStrictEqual('Spanish draft')
      expect(publishedAll.title.en).toStrictEqual('Eng published')
    })

    it('should publish non-default individual locale', async () => {
      // save spanish draft
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'Test span draft',
          content: 'Test span draft content',
        },
        draft: true,
        locale: 'es',
      })

      // publish only german
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'German published',
          _status: 'published',
        },
        locale: 'de',
        publishSpecificLocale: 'de',
      })

      const globalData = await payload.findGlobal({
        slug: global,
        locale: 'all',
      })

      // Expect only previous draft data to be present
      expect(globalData.title.es).toStrictEqual('Spanish draft')
      expect(globalData.title.de).toStrictEqual('German published')
    })

    it('should show correct data in latest version', async () => {
      // save spanish draft
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'New spanish draft',
          content: 'New spanish draft content',
        },
        draft: true,
        locale: 'es',
      })

      // publish only english
      await payload.updateGlobal({
        slug: global,
        data: {
          title: 'New eng',
          _status: 'published',
        },
        draft: false,
        publishSpecificLocale: 'en',
      })

      const allVersions = await payload.findGlobalVersions({
        slug: global,
        locale: 'all',
        where: {
          'version._status': {
            equals: 'published',
          },
        },
      })

      const versions = allVersions.docs
      const latestVersion = versions[0].version
      expect(latestVersion.title.es).toStrictEqual('Spanish draft')
      expect(latestVersion.title.en).toStrictEqual('New eng')
    })
  })
})
