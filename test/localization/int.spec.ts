import type { Payload, User, Where } from 'payload'

import { createPayloadReq } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type {
  ArrayField,
  BlocksField,
  LocalizedPost,
  LocalizedSort,
  Nested,
  WithLocalizedRelationship,
} from './payload-types.js'

import { isMongoose, mongooseList } from '../__helpers/shared/isMongoose.js'
import { devUser } from '../credentials.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { copyDataFromLocaleHandler } from '../../packages/ui/src/utilities/copyDataFromLocale.js'
import { test } from '../__helpers/int/vitest.js'
import { idToString } from '../__helpers/shared/idToString.js'
import { arrayCollectionSlug } from './collections/Array/index.js'
import { groupSlug } from './collections/Group/index.js'
import { nestedToArrayAndBlockCollectionSlug } from './collections/NestedToArrayAndBlock/index.js'
import { noLocalizedFieldsCollectionSlug } from './collections/NoLocalizedFields/index.js'
import { tabSlug } from './collections/Tab/index.js'
import {
  allFieldsLocalizedSlug,
  defaultLocale,
  defaultLocale as englishLocale,
  englishTitle,
  globalWithDraftsSlug,
  hungarianLocale,
  localizedDateFieldsSlug,
  localizedDraftsSlug,
  localizedPostsSlug,
  localizedSortSlug,
  portugueseLocale,
  publicationAccessGlobalSlug,
  publicationAccessSlug,
  publicationAsyncFieldHookSlug,
  publicationBeforeOperationGlobalSlug,
  publicationBeforeOperationSanitizeGlobalSlug,
  publicationBeforeOperationSlug,
  publicationFieldAccessGlobalSlug,
  publicationFieldAccessSlug,
  publicationHookGlobalSlug,
  publicationHookSlug,
  relationEnglishTitle,
  relationEnglishTitle2,
  relationshipLocalizedSlug,
  relationSpanishTitle,
  relationSpanishTitle2,
  spanishLocale,
  spanishTitle,
  withLocalizedRelSlug,
  withRequiredLocalizedFields,
} from './shared.js'

const collection = localizedPostsSlug
const global = 'global-text'

test.suite('Localization', { config: './config.ts', resetBetweenTests: false }, () => {
  test.describe('Localization with fallback true', () => {
    let post1: LocalizedPost
    let postWithLocalizedData: LocalizedPost

    test.beforeAll(async ({ payloadInstance: payload }) => {
      post1 = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
        overrideAccess: true,
      })

      postWithLocalizedData = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
        overrideAccess: true,
      })

      await payload.update({
        id: postWithLocalizedData.id,
        collection,
        data: {
          title: spanishTitle,
        },
        locale: spanishLocale,
        overrideAccess: true,
      })

      await payload.updateGlobal({
        slug: global,
        data: {
          text: spanishTitle,
        },
        locale: spanishLocale,
        overrideAccess: true,
      })

      await payload.updateGlobal({
        slug: global,
        data: {
          text: englishTitle,
        },
        locale: englishLocale,
        overrideAccess: true,
      })
    })

    test.describe('Localized text', () => {
      test('create english', async ({ payload }) => {
        const allDocs = await payload.find({
          collection,
          overrideAccess: true,
          where: {
            title: { equals: post1.title },
          },
        })
        expect(allDocs.docs).toContainEqual(expect.objectContaining(post1))
      })

      test('add spanish translation', async ({ payload }) => {
        const updated = await payload.update({
          id: post1.id,
          collection,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(updated.title).toEqual(spanishTitle)

        const localized: any = await payload.findByID({
          id: post1.id,
          collection,
          locale: 'all',
          overrideAccess: true,
        })

        expect(localized.title.en).toEqual(englishTitle)
        expect(localized.title.es).toEqual(spanishTitle)
      })

      test('should fallback to english translation when empty', async ({ payload }) => {
        await payload.update({
          id: post1.id,
          collection,
          data: {
            title: '',
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const retrievedInSpanish = await payload.findByID({
          id: post1.id,
          collection,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(retrievedInSpanish.title).toEqual(englishTitle)

        const localizedFallback: any = await payload.findByID({
          id: post1.id,
          collection,
          locale: 'all',
          overrideAccess: true,
        })

        expect(localizedFallback.title.en).toEqual(englishTitle)
        expect(localizedFallback.title.es).toEqual('')
      })

      test('should show correct fallback data for arrays', async ({ payload }) => {
        const localizedArrayPost = await payload.create({
          collection: arrayCollectionSlug,
          data: {
            items: [
              {
                text: 'localized array item',
              },
            ],
          },
          overrideAccess: true,
        })

        const resultAllLocales: any = await payload.findByID({
          id: localizedArrayPost.id,
          collection: arrayCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(resultAllLocales.items.en[0].text).toEqual('localized array item')
        expect(resultAllLocales.items.es).toEqual(undefined)

        const resultSpanishLocale: any = await payload.findByID({
          id: localizedArrayPost.id,
          collection: arrayCollectionSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(resultSpanishLocale.items[0].text).toEqual('localized array item')
      })

      test('should fallback to spanish translation when empty and locale-specific fallback is provided', async ({
        payload,
      }) => {
        const localizedFallback: any = await payload.findByID({
          id: postWithLocalizedData.id,
          collection,
          locale: portugueseLocale,
          overrideAccess: true,
        })

        expect(localizedFallback.title).toEqual(spanishTitle)
      })

      test('should respect fallback none', async ({ payload }) => {
        const localizedFallback: any = await payload.findByID({
          id: postWithLocalizedData.id,
          collection,
          fallbackLocale: 'none',
          locale: portugueseLocale,
          overrideAccess: true,
        })

        expect(localizedFallback.title).not.toBeDefined()
      })

      test.describe('fallback locales', () => {
        let englishData
        let spanishData
        let localizedDoc

        test.beforeAll(async ({ payloadInstance: payload }) => {
          englishData = {
            localizedCheckbox: false,
          }
          spanishData = {
            localizedCheckbox: true,
            title: 'spanish title',
          }

          localizedDoc = await payload.create({
            collection: localizedPostsSlug,
            data: englishData,
            locale: englishLocale,
            overrideAccess: true,
          })

          await payload.update({
            id: localizedDoc.id,
            collection: localizedPostsSlug,
            data: spanishData,
            locale: spanishLocale,
            overrideAccess: true,
          })
          await payload.update({
            id: localizedDoc.id,
            collection: localizedPostsSlug,
            data: { localizedCheckbox: true },
            locale: portugueseLocale,
            overrideAccess: true,
          })
        })

        test('should return localized fields using fallbackLocale specified in the requested locale config', async ({
          payload,
        }) => {
          const portugueseDoc = await payload.findByID({
            id: localizedDoc.id,
            collection: localizedPostsSlug,
            locale: portugueseLocale,
            overrideAccess: true,
          })

          expect(portugueseDoc.title).toStrictEqual(spanishData.title)
          expect(portugueseDoc.localizedCheckbox).toStrictEqual(true)
        })
      })

      test.describe('querying', () => {
        let localizedPost: LocalizedPost
        test.beforeEach(async ({ payload }) => {
          const { id } = await payload.create({
            collection,
            data: {
              title: englishTitle,
            },
            overrideAccess: true,
          })

          localizedPost = await payload.update({
            id,
            collection,
            data: {
              title: spanishTitle,
            },
            locale: spanishLocale,
            overrideAccess: true,
          })
        })

        test('unspecified locale returns default', async ({ payload }) => {
          const localized = await payload.findByID({
            id: localizedPost.id,
            collection,
            overrideAccess: true,
          })

          expect(localized.title).toEqual(englishTitle)
        })

        test('specific locale - same as default', async ({ payload }) => {
          const localized = await payload.findByID({
            id: localizedPost.id,
            collection,
            locale: defaultLocale,
            overrideAccess: true,
          })

          expect(localized.title).toEqual(englishTitle)
        })

        test('specific locale - not default', async ({ payload }) => {
          const localized = await payload.findByID({
            id: localizedPost.id,
            collection,
            locale: spanishLocale,
            overrideAccess: true,
          })

          expect(localized.title).toEqual(spanishTitle)
        })

        test('all locales', async ({ payload }) => {
          const localized: any = await payload.findByID({
            id: localizedPost.id,
            collection,
            locale: 'all',
            overrideAccess: true,
          })

          expect(localized.title.en).toEqual(englishTitle)
          expect(localized.title.es).toEqual(spanishTitle)
        })

        test('rest all locales with all', async ({ restClient }) => {
          const response = await restClient.GET(`/${collection}/${localizedPost.id}`, {
            query: {
              locale: 'all',
            },
          })

          expect(response.status).toBe(200)
          const localized = await response.json()

          expect(localized.title.en).toEqual(englishTitle)
          expect(localized.title.es).toEqual(spanishTitle)
        })

        test('rest all locales with asterisk', async ({ restClient }) => {
          const response = await restClient.GET(`/${collection}/${localizedPost.id}`, {
            query: {
              locale: '*',
            },
          })

          expect(response.status).toBe(200)
          const localized = await response.json()

          expect(localized.title.en).toEqual(englishTitle)
          expect(localized.title.es).toEqual(spanishTitle)
        })

        test('by localized field value - default locale', async ({ payload }) => {
          const result = await payload.find({
            collection,
            overrideAccess: true,
            where: {
              title: {
                equals: englishTitle,
              },
            },
          })

          expect(result.docs.map(({ id }) => id)).toContain(localizedPost.id)
        })

        test('by localized field value - alternate locale', async ({ payload }) => {
          const result = await payload.find({
            collection,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              title: {
                equals: spanishTitle,
              },
            },
          })

          expect(result.docs.map(({ id }) => id)).toContain(localizedPost.id)
        })

        test('by localized field value - opposite locale???', async ({ payload }) => {
          const result = await payload.find({
            collection,
            locale: 'all',
            overrideAccess: true,
            where: {
              'title.es': {
                equals: spanishTitle,
              },
            },
          })

          expect(result.docs.map(({ id }) => id)).toContain(localizedPost.id)
        })

        test('by localized field value with sorting', async ({ payload }) => {
          const doc_1 = await payload.create({
            collection,
            data: { title: 'word_b' },
            overrideAccess: true,
          })
          const doc_2 = await payload.create({
            collection,
            data: { title: 'word_a' },
            overrideAccess: true,
          })
          const doc_3 = await payload.create({
            collection,
            data: { title: 'word_c' },
            overrideAccess: true,
          })

          await payload.create({ collection, data: { title: 'others_c' }, overrideAccess: true })

          const { docs } = await payload.find({
            collection,
            overrideAccess: true,
            sort: 'title',
            where: {
              title: {
                like: 'word',
              },
            },
          })

          expect(docs).toHaveLength(3)
          expect(docs[0].id).toBe(doc_2.id)
          expect(docs[1].id).toBe(doc_1.id)
          expect(docs[2].id).toBe(doc_3.id)
        })

        if (mongooseList.includes(process.env.PAYLOAD_DATABASE)) {
          test.describe('Localized sorting', () => {
            let localizedAccentPostOne: LocalizedPost
            let localizedAccentPostTwo: LocalizedPost
            test.beforeEach(async ({ payload }) => {
              localizedAccentPostOne = await payload.create({
                collection,
                data: {
                  localizedDescription: 'something',
                  title: 'non accent post',
                },
                locale: englishLocale,
                overrideAccess: true,
              })

              localizedAccentPostTwo = await payload.create({
                collection,
                data: {
                  localizedDescription: 'veterinarian',
                  title: 'accent post',
                },
                locale: englishLocale,
                overrideAccess: true,
              })

              await payload.update({
                id: localizedAccentPostOne.id,
                collection,
                data: {
                  localizedDescription: 'valami',
                  title: 'non accent post',
                },
                locale: hungarianLocale,
                overrideAccess: true,
              })

              await payload.update({
                id: localizedAccentPostTwo.id,
                collection,
                data: {
                  localizedDescription: 'állatorvos',
                  title: 'accent post',
                },
                locale: hungarianLocale,
                overrideAccess: true,
              })
            })

            test('should sort alphabetically even with accented letters', async ({ payload }) => {
              const sortByDescriptionQuery = await payload.find({
                collection,
                locale: hungarianLocale,
                overrideAccess: true,
                sort: 'description',
                where: {
                  title: {
                    like: 'accent',
                  },
                },
              })

              expect(sortByDescriptionQuery.docs[0].id).toEqual(localizedAccentPostTwo.id)
            })
          })
        }
      })
    })

    test.describe('Localized date', () => {
      test('can create a localized date', async ({ payload }) => {
        const document = await payload.create({
          collection: localizedDateFieldsSlug,
          data: {
            date: new Date().toISOString(),
            localizedDate: new Date().toISOString(),
          },
          overrideAccess: true,
        })
        expect(document.localizedDate).toBeTruthy()
      })

      test('data is typed as string', async ({ payload }) => {
        const document = await payload.create({
          collection: localizedDateFieldsSlug,
          data: {
            date: new Date().toISOString(),
            localizedDate: new Date().toISOString(),
          },
          overrideAccess: true,
        })

        expect(typeof document.localizedDate).toBe('string')
        expect(typeof document.date).toBe('string')
      })
    })

    test.describe('Localized Sort Count', () => {
      const expectedTotalDocs = 5
      const posts: LocalizedSort[] = []
      test.beforeAll(async ({ payloadInstance: payload }) => {
        for (let i = 1; i <= expectedTotalDocs; i++) {
          const post = await payload.create({
            collection: localizedSortSlug,
            data: {
              date: new Date().toISOString(),
              title: `EN ${i}`,
            },
            locale: englishLocale,
            overrideAccess: true,
          })

          posts.push(post)

          await payload.update({
            id: post.id,
            collection: localizedSortSlug,
            data: {
              date: new Date().toISOString(),
              title: `ES ${i}`,
            },
            locale: spanishLocale,
            overrideAccess: true,
          })
        }
      })

      test('should have correct totalDocs when unsorted', async ({ payload }) => {
        const simpleQuery = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
        })
        const sortByIdQuery = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
          sort: 'id',
        })

        expect(simpleQuery.totalDocs).toEqual(expectedTotalDocs)
        expect(sortByIdQuery.totalDocs).toEqual(expectedTotalDocs)
      })

      // https://github.com/payloadcms/payload/issues/4889
      test('should have correct totalDocs when sorted by localized fields', async ({ payload }) => {
        const sortByTitleQuery = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
          sort: 'title',
        })
        const sortByDateQuery = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
          sort: 'date',
        })

        expect(sortByTitleQuery.totalDocs).toEqual(expectedTotalDocs)
        expect(sortByDateQuery.totalDocs).toEqual(expectedTotalDocs)
      })

      test('should return correct order when sorted by localized fields', async ({ payload }) => {
        const { docs: docsAsc } = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
          sort: 'title',
        })
        docsAsc.forEach((doc, i) => {
          expect(posts[i].id).toBe(doc.id)
        })

        const { docs: docsDesc } = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
          sort: '-title',
        })
        docsDesc.forEach((doc, i) => {
          expect(posts.at(posts.length - i - 1).id).toBe(doc.id)
        })

        // Test with words
        const randomWords = [
          'sunset',
          'whisper',
          'lighthouse',
          'harmony',
          'crystal',
          'thunder',
          'meadow',
          'voyage',
          'echo',
          'quicksand',
        ]

        const randomWordsSpanish = [
          'atardecer',
          'susurro',
          'faro',
          'armonía',
          'cristal',
          'trueno',
          'pradera',
          'viaje',
          'eco',
          'arenas movedizas',
        ]

        expect(randomWords).toHaveLength(randomWordsSpanish.length)

        const randomWordsPosts: (number | string)[] = []

        for (let i = 0; i < randomWords.length; i++) {
          const en = randomWords[i]
          const post = await payload.create({
            collection: 'localized-sort',
            data: { title: en },
            overrideAccess: true,
          })
          const es = randomWordsSpanish[i]
          await payload.update({
            id: post.id,
            collection: 'localized-sort',
            data: { title: es },
            locale: 'es',
            overrideAccess: true,
          })

          randomWordsPosts.push(post.id)
        }

        const ascSortedWordsEn = randomWords.toSorted((a, b) => a.localeCompare(b))
        const descSortedWordsEn = randomWords.toSorted((a, b) => b.localeCompare(a))

        const q = { id: { in: randomWordsPosts } }

        const { docs: randomWordsEnAsc } = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
          sort: 'title',
          where: q,
        })
        randomWordsEnAsc.forEach((doc, i) => {
          expect(ascSortedWordsEn[i]).toBe(doc.title)
        })

        const { docs: randomWordsEnDesc } = await payload.find({
          collection: localizedSortSlug,
          overrideAccess: true,
          sort: '-title',
          where: q,
        })

        randomWordsEnDesc.forEach((doc, i) => {
          expect(descSortedWordsEn[i]).toBe(doc.title)
        })

        // Test sorting for Spanish locale
        const ascSortedWordsEs = randomWordsSpanish.toSorted((a, b) => a.localeCompare(b))
        const descSortedWordsEs = randomWordsSpanish.toSorted((a, b) => b.localeCompare(a))

        // Fetch sorted words in Spanish (ascending)
        const { docs: randomWordsEsAsc } = await payload.find({
          collection: localizedSortSlug,
          locale: 'es',
          overrideAccess: true,
          sort: 'title',
          where: q,
        })

        randomWordsEsAsc.forEach((doc, i) => {
          expect(ascSortedWordsEs[i]).toBe(doc.title)
        })

        // Fetch sorted words in Spanish (descending)
        const { docs: randomWordsEsDesc } = await payload.find({
          collection: localizedSortSlug,
          locale: 'es',
          overrideAccess: true,
          sort: '-title',
          where: q,
        })

        randomWordsEsDesc.forEach((doc, i) => {
          expect(descSortedWordsEs[i]).toBe(doc.title)
        })
      })
    })

    test.describe('Localized Relationship', () => {
      let localizedRelation: LocalizedPost
      let localizedRelation2: LocalizedPost
      let withRelationship: WithLocalizedRelationship

      test.beforeAll(async ({ payloadInstance: payload }) => {
        localizedRelation = await createLocalizedPost(
          { payload },
          {
            title: {
              [defaultLocale]: relationEnglishTitle,
              [spanishLocale]: relationSpanishTitle,
            },
          },
        )
        localizedRelation2 = await createLocalizedPost(
          { payload },
          {
            title: {
              [defaultLocale]: relationEnglishTitle2,
              [spanishLocale]: relationSpanishTitle2,
            },
          },
        )

        withRelationship = await payload.create({
          collection: withLocalizedRelSlug,
          data: {
            localizedRelationHasManyField: [localizedRelation.id, localizedRelation2.id],
            localizedRelationMultiRelationTo: {
              relationTo: localizedPostsSlug,
              value: localizedRelation.id,
            },
            localizedRelationMultiRelationToHasMany: [
              { relationTo: localizedPostsSlug, value: localizedRelation.id },
              { relationTo: localizedPostsSlug, value: localizedRelation2.id },
            ],
            localizedRelationship: localizedRelation.id,
          },
          overrideAccess: true,
        })
      })

      test.describe('regular relationship', () => {
        test('can query localized relationship', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
            overrideAccess: true,
            where: {
              'localizedRelationship.title': {
                equals: localizedRelation.title,
              },
            },
          })

          expect(result.docs[0].id).toEqual(withRelationship.id)
        })

        test('specific locale', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              'localizedRelationship.title': {
                equals: relationSpanishTitle,
              },
            },
          })

          expect(result.docs[0].id).toEqual(withRelationship.id)
        })

        test('all locales', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
            locale: 'all',
            overrideAccess: true,
            where: {
              'localizedRelationship.title.es': {
                equals: relationSpanishTitle,
              },
            },
          })

          expect(result.docs[0].id).toEqual(withRelationship.id)
        })

        test('populates relationships with all locales', async ({ payload }) => {
          // the relationship fields themselves are localized on this collection
          const result: any = await payload.find({
            collection: relationshipLocalizedSlug,
            depth: 1,
            locale: 'all',
            overrideAccess: true,
          })

          expect(result.docs[0].relationship.en.id).toBeDefined()
          expect(result.docs[0].relationshipHasMany.en[0].id).toBeDefined()
          expect(result.docs[0].relationMultiRelationTo.en.value.id).toBeDefined()
          expect(result.docs[0].relationMultiRelationToHasMany.en[0].value.id).toBeDefined()
          expect(result.docs[0].arrayField.en[0].nestedRelation.id).toBeDefined()
        })
      })

      test.describe('relationship - hasMany', () => {
        test('default locale', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
            overrideAccess: true,
            where: {
              'localizedRelationHasManyField.title': {
                equals: localizedRelation.title,
              },
            },
          })

          expect(result.docs.map(({ id }) => id)).toContain(withRelationship.id)

          // Second relationship
          const result2 = await payload.find({
            collection: withLocalizedRelSlug,
            overrideAccess: true,
            where: {
              'localizedRelationHasManyField.title': {
                equals: localizedRelation2.title,
              },
            },
          })

          expect(result2.docs.map(({ id }) => id)).toContain(withRelationship.id)
        })

        test('specific locale', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              'localizedRelationHasManyField.title': {
                equals: relationSpanishTitle,
              },
            },
          })

          expect(result.docs[0].id).toEqual(withRelationship.id)

          // Second relationship
          const result2 = await payload.find({
            collection: withLocalizedRelSlug,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              'localizedRelationHasManyField.title': {
                equals: relationSpanishTitle2,
              },
            },
          })

          expect(result2.docs[0].id).toEqual(withRelationship.id)
        })

        test('relationship population uses locale', async ({ payload }) => {
          const result = await payload.findByID({
            id: withRelationship.id,
            collection: withLocalizedRelSlug,
            depth: 1,
            locale: spanishLocale,
            overrideAccess: true,
          })
          expect((result.localizedRelationship as LocalizedPost).title).toEqual(
            relationSpanishTitle,
          )
        })

        test('all locales', async ({ payload }) => {
          const queryRelation = (where: Where) => {
            return payload.find({
              collection: withLocalizedRelSlug,
              locale: 'all',
              overrideAccess: true,
              where,
            })
          }

          const result = await queryRelation({
            'localizedRelationHasManyField.title.en': {
              equals: relationEnglishTitle,
            },
          })

          expect(result.docs.map(({ id }) => id)).toContain(withRelationship.id)

          // First relationship - spanish
          const result2 = await queryRelation({
            'localizedRelationHasManyField.title.es': {
              equals: relationSpanishTitle,
            },
          })

          expect(result2.docs.map(({ id }) => id)).toContain(withRelationship.id)

          // Second relationship - english
          const result3 = await queryRelation({
            'localizedRelationHasManyField.title.en': {
              equals: relationEnglishTitle2,
            },
          })

          expect(result3.docs.map(({ id }) => id)).toContain(withRelationship.id)

          // Second relationship - spanish
          const result4 = await queryRelation({
            'localizedRelationHasManyField.title.es': {
              equals: relationSpanishTitle2,
            },
          })

          expect(result4.docs[0].id).toEqual(withRelationship.id)
        })
      })

      test.describe('relationTo multi', () => {
        test('by id', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
            overrideAccess: true,
            where: {
              'localizedRelationMultiRelationTo.value': {
                equals: localizedRelation.id,
              },
            },
          })

          expect(result.docs[0].id).toEqual(withRelationship.id)

          // Second relationship
          const result2 = await payload.find({
            collection: withLocalizedRelSlug,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              'localizedRelationMultiRelationTo.value': {
                equals: localizedRelation.id,
              },
            },
          })

          expect(result2.docs[0].id).toEqual(withRelationship.id)
        })
      })

      test.describe('relationTo multi hasMany', () => {
        test('by id', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
            overrideAccess: true,
            where: {
              'localizedRelationMultiRelationToHasMany.value': {
                equals: localizedRelation.id,
              },
            },
          })

          expect(result.docs[0].id).toEqual(withRelationship.id)

          // First relationship - spanish locale
          const result2 = await payload.find({
            collection: withLocalizedRelSlug,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              'localizedRelationMultiRelationToHasMany.value': {
                equals: localizedRelation.id,
              },
            },
          })

          expect(result2.docs[0].id).toEqual(withRelationship.id)

          // Second relationship
          const result3 = await payload.find({
            collection: withLocalizedRelSlug,
            overrideAccess: true,
            where: {
              'localizedRelationMultiRelationToHasMany.value': {
                equals: localizedRelation2.id,
              },
            },
          })

          expect(result3.docs[0].id).toEqual(withRelationship.id)

          // Second relationship - spanish locale
          const result4 = await payload.find({
            collection: withLocalizedRelSlug,
            overrideAccess: true,
            where: {
              'localizedRelationMultiRelationToHasMany.value': {
                equals: localizedRelation2.id,
              },
            },
          })

          expect(result4.docs[0].id).toEqual(withRelationship.id)
        })
      })
    })

    test.describe('Localized - arrays with nested localized fields', () => {
      test('should allow moving rows and retain existing row locale data', async ({ payload }) => {
        const globalArray: any = await payload.findGlobal({
          slug: 'global-array',
          overrideAccess: true,
        })

        const reversedArrayRows = [...globalArray.array].reverse()

        const updatedGlobal = await payload.updateGlobal({
          slug: 'global-array',
          data: {
            array: reversedArrayRows,
          },
          locale: 'all',
          overrideAccess: true,
        })

        expect(updatedGlobal.array[0].text.en).toStrictEqual('test en 2')
        expect(updatedGlobal.array[0].text.es).toStrictEqual('test es 2')
      })
    })

    test.describe('Localized - required', () => {
      test('should update without passing all required fields', async ({ payload }) => {
        const newDoc = await payload.create({
          collection: withRequiredLocalizedFields,
          data: {
            nav: {
              layout: [
                {
                  blockType: 'text',
                  text: 'laiwejfilwaje',
                },
              ],
            },
            title: 'hello',
          },
          overrideAccess: true,
        })

        await payload.update({
          id: newDoc.id,
          collection: withRequiredLocalizedFields,
          data: {
            nav: {
              layout: [
                {
                  blockType: 'number',
                  number: 12,
                },
              ],
            },
            title: 'en espanol, big bird',
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const updatedDoc = await payload.update({
          id: newDoc.id,
          collection: withRequiredLocalizedFields,
          data: {
            title: 'hello x2',
          },
          overrideAccess: true,
        })

        expect(updatedDoc.nav.layout[0].blockType).toStrictEqual('text')

        const spanishDoc = await payload.findByID({
          id: newDoc.id,
          collection: withRequiredLocalizedFields,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(spanishDoc.nav.layout[0].blockType).toStrictEqual('number')
      })
    })

    test.describe('Localized - GraphQL', () => {
      let token

      test.beforeAll(async ({ restClientInstance: restClient }) => {
        const query = `mutation {
          loginUser(email: "dev@payloadcms.com", password: "test") {
            token
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            query: { locale: 'en' },
          })
          .then((res) => res.json())

        token = data.loginUser.token
      })

      test('should allow user to login and retrieve populated localized field', async ({
        restClient,
      }) => {
        const query = `mutation {
        loginUser(email: "dev@payloadcms.com", password: "test") {
          token
          user {
            relation {
              title
            }
          }
        }
      }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            query: { locale: 'en' },
          })
          .then((res) => res.json())
        const result = data.loginUser

        expect(typeof result.token).toStrictEqual('string')
        expect(typeof result.user.relation.title).toStrictEqual('string')
      })

      test('should allow retrieval of populated localized fields within meUser', async ({
        restClient,
      }) => {
        const query = `query {
        meUser {
          user {
            id
            relation {
              title
            }
          }
        }
      }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
            query: { locale: 'en' },
          })
          .then((res) => res.json())
        const result = data.meUser

        expect(typeof result.user.relation.title).toStrictEqual('string')
      })

      test('should create and update collections', async ({ payload, restClient }) => {
        const create = `mutation {
        createLocalizedPost(
          data: {
            title: "${englishTitle}"
          }
          locale: ${defaultLocale}
        ) {
          id
          title
        }
      }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query: create }),
            headers: {
              Authorization: `JWT ${token}`,
            },
            query: { locale: 'en' },
          })
          .then((res) => res.json())
        const createResult = data.createLocalizedPost

        const update = `mutation {
        updateLocalizedPost(
          id: ${payload.db.defaultIDType === 'number' ? createResult.id : `"${createResult.id}"`},
          data: {
            title: "${spanishTitle}"
          }
          locale: ${spanishLocale}
        ) {
          title
        }
      }`

        const { data: updateData } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query: update }),
            headers: {
              Authorization: `JWT ${token}`,
            },
            query: { locale: 'en' },
          })
          .then((res) => res.json())
        const updateResult = updateData.updateLocalizedPost

        const result = await payload.findByID({
          id: createResult.id,
          collection: localizedPostsSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(createResult.title).toStrictEqual(englishTitle)
        expect(updateResult.title).toStrictEqual(spanishTitle)
        expect(result.title[defaultLocale]).toStrictEqual(englishTitle)
        expect(result.title[spanishLocale]).toStrictEqual(spanishTitle)
      })

      test('should query multiple locales', async ({ payload, restClient }) => {
        const englishDoc = await payload.create({
          collection: localizedPostsSlug,
          data: {
            title: englishTitle,
          },
          locale: defaultLocale,
          overrideAccess: true,
        })
        const spanishDoc = await payload.create({
          collection: localizedPostsSlug,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
          overrideAccess: true,
        })
        const query = `
      {
        es: LocalizedPost(id: ${idToString(spanishDoc.id, payload)}, locale: es) {
          title
        }
        en: LocalizedPost(id: ${idToString(englishDoc.id, payload)}, locale: en) {
          title
        }
      }
      `

        const { data: multipleLocaleData } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
            query: { locale: 'en' },
          })
          .then((res) => res.json())

        const { en, es } = multipleLocaleData

        expect(en.title).toStrictEqual(englishTitle)
        expect(es.title).toStrictEqual(spanishTitle)
      })
    })

    test.describe('Localized - Arrays', () => {
      let docID

      test.beforeAll(async ({ payloadInstance: payload }) => {
        const englishDoc = await payload.create({
          collection: arrayCollectionSlug,
          data: {
            items: [
              {
                text: englishTitle,
              },
            ],
          },
          overrideAccess: true,
        })

        docID = englishDoc.id
      })

      test('should use default locale as fallback', async ({ payload }) => {
        const spanishDoc = await payload.findByID({
          id: docID,
          collection: arrayCollectionSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(spanishDoc.items[0].text).toStrictEqual(englishTitle)
      })

      test('should use empty array as value', async ({ payload }) => {
        const updatedSpanishDoc = await payload.update({
          id: docID,
          collection: arrayCollectionSlug,
          data: {
            items: [],
          },
          fallbackLocale: false,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(updatedSpanishDoc.items).toStrictEqual(null)
      })

      test('should allow optional fallback data', async ({ payload }) => {
        const englishDoc = await payload.create({
          collection: arrayCollectionSlug,
          data: {
            items: [
              {
                text: englishTitle,
              },
            ],
          },
          locale: defaultLocale,
          overrideAccess: true,
        })

        await payload.update({
          id: englishDoc.id,
          collection: arrayCollectionSlug,
          data: {
            items: [],
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docWithoutFallback = await payload.findByID({
          id: englishDoc.id,
          collection: arrayCollectionSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        if (isMongoose(payload)) {
          expect(docWithoutFallback.items).toStrictEqual(null)
        } else {
          // TODO: build out compatability with SQL databases
          // Currently SQL databases always fallback since the localized values are joined in.
          // The join only has 2 states, undefined or the localized value of the requested locale.
          // If the localized value is not in the DB, there is no way to know if the value should fallback or not so we fallback if fallbackLocale is truthy.
          // In MongoDB the value can be set to null, which allows us to know that the value should fallback.

          expect(docWithoutFallback.items).toStrictEqual(englishDoc.items)
        }
      })

      test('should use fallback value if setting null', async ({ payload }) => {
        await payload.update({
          id: docID,
          collection: arrayCollectionSlug,
          data: {
            items: [],
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const updatedSpanishDoc = await payload.update({
          id: docID,
          collection: arrayCollectionSlug,
          data: {
            items: null,
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        // should return the value of the fallback locale
        expect(updatedSpanishDoc.items[0].text).toStrictEqual(englishTitle)
      })
    })

    test.describe('Localized - Field Paths', () => {
      test('should allow querying by non-localized field names ending in a locale', async ({
        payload,
        restClient,
      }) => {
        await payload.update({
          id: post1.id,
          collection,
          data: {
            children: post1.id,
            group: {
              children: 'something',
            },
          },
          overrideAccess: true,
        })

        const { docs: relationshipDocs } = await restClient
          .GET(`/${collection}`, {
            query: {
              where: {
                children: {
                  in: post1.id,
                },
              },
            },
          })
          .then((res) => res.json())

        expect(relationshipDocs.map(({ id }) => id)).toContain(post1.id)

        const { docs: nestedFieldDocs } = await restClient
          .GET(`/${collection}`, {
            query: {
              where: {
                'group.children': {
                  contains: 'some',
                },
              },
            },
          })
          .then((res) => res.json())

        expect(nestedFieldDocs.map(({ id }) => id)).toContain(post1.id)
      })
    })

    test.describe('Nested To Array And Block', () => {
      test('should be equal to the created document', async ({ payload }) => {
        const { id, blocks } = await payload.create({
          collection: nestedToArrayAndBlockCollectionSlug,
          data: {
            blocks: [
              {
                array: [
                  {
                    text: 'english',
                    textNotLocalized: 'test',
                  },
                ],
                blockType: 'block',
              },
            ],
          },
          locale: defaultLocale,
          overrideAccess: true,
        })

        await payload.update({
          id,
          collection: nestedToArrayAndBlockCollectionSlug,
          data: {
            blocks: (blocks as { array: { text: string }[] }[]).map((block) => ({
              ...block,
              array: block.array.map((item) => ({ ...item, text: 'spanish' })),
            })),
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docDefaultLocale = await payload.findByID({
          id,
          collection: nestedToArrayAndBlockCollectionSlug,
          locale: defaultLocale,
          overrideAccess: true,
        })

        const docSpanishLocale = await payload.findByID({
          id,
          collection: nestedToArrayAndBlockCollectionSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        const rowDefault = docDefaultLocale.blocks[0].array[0]
        const rowSpanish = docSpanishLocale.blocks[0].array[0]

        expect(rowDefault.text).toEqual('english')
        expect(rowDefault.textNotLocalized).toEqual('test')
        expect(rowSpanish.text).toEqual('spanish')
        expect(rowSpanish.textNotLocalized).toEqual('test')
      })
    })

    test.describe('Duplicate Collection', () => {
      test('should duplicate localized document', async ({ payload }) => {
        const localizedPost = await payload.create({
          collection: localizedPostsSlug,
          data: {
            localizedCheckbox: true,
            title: englishTitle,
          },
          locale: defaultLocale,
          overrideAccess: true,
        })

        const id = localizedPost.id.toString()

        await payload.update({
          id,
          collection: localizedPostsSlug,
          data: {
            localizedCheckbox: false,
            title: spanishTitle,
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const result = await payload.duplicate({
          id,
          collection: localizedPostsSlug,
          locale: defaultLocale,
          overrideAccess: true,
        })

        const allLocales = await payload.findByID({
          id: result.id,
          collection: localizedPostsSlug,
          locale: 'all',
          overrideAccess: true,
        })

        // check fields
        expect(result.title).toStrictEqual(englishTitle)

        expect(allLocales.title.es).toStrictEqual(spanishTitle)

        expect(allLocales.localizedCheckbox.en).toBeTruthy()
        expect(allLocales.localizedCheckbox.es).toBeFalsy()
      })

      test('should duplicate with localized blocks', async ({ payload }) => {
        // This test covers a few things:
        // 1. make sure we can duplicate localized blocks
        //    - in relational DBs, we need to create new block / array IDs
        //    - and this needs to be done recursively for all block / array fields
        // 2. make sure localized arrays / blocks work inside of localized groups / tabs
        //    - this is covered with myTab.group.nestedArray2
        // 3. the field schema for `nav` is within an unnamed tab, which tests that we
        //    properly recursively loop through all field structures / types

        const englishText = 'english'
        const spanishText = 'spanish'
        const doc = await payload.create({
          collection: withRequiredLocalizedFields,
          data: {
            myTab: {
              group: {
                nestedArray2: [
                  {
                    nestedText: 'hello',
                  },
                  {
                    nestedText: 'goodbye',
                  },
                ],
                nestedText: 'hello',
              },
              text: 'hello',
            },
            nav: {
              layout: [
                {
                  blockType: 'text',
                  nestedArray: [
                    {
                      l2: [
                        {
                          l3: [
                            {
                              l4: [
                                {
                                  superNestedText: 'hello',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                      text: 'hello',
                    },
                    {
                      l2: [
                        {
                          l3: [
                            {
                              l4: [
                                {
                                  superNestedText: 'goodbye',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                      text: 'goodbye',
                    },
                  ],
                  text: englishText,
                },
              ],
            },
            title: 'hello',
          },
          locale: defaultLocale,
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: withRequiredLocalizedFields,
          data: {
            myTab: {
              group: {
                nestedArray2: [
                  {
                    nestedText: 'hola',
                  },
                  {
                    nestedText: 'adios',
                  },
                ],
                nestedText: 'hola',
              },
              text: 'hola',
            },
            nav: {
              layout: [
                {
                  blockType: 'text',
                  nestedArray: [
                    {
                      l2: [
                        {
                          l3: [
                            {
                              l4: [
                                {
                                  superNestedText: 'hola',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                      text: 'hola',
                    },
                    {
                      l2: [
                        {
                          l3: [
                            {
                              l4: [
                                {
                                  superNestedText: 'adios',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                      text: 'adios',
                    },
                  ],
                  text: spanishText,
                },
              ],
            },
            title: 'hello',
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const result = await payload.duplicate({
          id: doc.id,
          collection: withRequiredLocalizedFields,
          locale: defaultLocale,
          overrideAccess: true,
        })

        const allLocales = await payload.findByID({
          id: result.id,
          collection: withRequiredLocalizedFields,
          locale: 'all',
          overrideAccess: true,
        })

        // check fields
        expect(result.nav.layout[0].text).toStrictEqual(englishText)

        expect(allLocales.nav.layout.en[0].text).toStrictEqual(englishText)
        expect(allLocales.nav.layout.es[0].text).toStrictEqual(spanishText)

        expect(allLocales.myTab.group.en.nestedText).toStrictEqual('hello')
        expect(allLocales.myTab.group.en.nestedArray2[0].nestedText).toStrictEqual('hello')
        expect(allLocales.myTab.group.en.nestedArray2[1].nestedText).toStrictEqual('goodbye')

        expect(allLocales.myTab.group.es.nestedText).toStrictEqual('hola')
        expect(allLocales.myTab.group.es.nestedArray2[0].nestedText).toStrictEqual('hola')
        expect(allLocales.myTab.group.es.nestedArray2[1].nestedText).toStrictEqual('adios')
      })

      test('should retain non-localized fields when duplicating select locales', async ({
        payload,
      }) => {
        const post = await payload.create({
          collection,
          data: {
            description: 'keep me',
            title: englishTitle,
          },
          overrideAccess: true,
        })

        await payload.update({
          id: post.id,
          collection,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const duplicated = await payload.duplicate({
          id: post.id,
          collection,
          overrideAccess: true,
          selectedLocales: [spanishLocale],
        })

        const allLocales = await payload.findByID({
          id: duplicated.id,
          collection,
          locale: 'all',
          overrideAccess: true,
        })

        expect(allLocales?.title?.en).toBe(undefined)
        expect(allLocales?.title?.es).toBe(spanishTitle)
        expect(allLocales?.description).toBe('keep me')
      })
    })

    test.describe('Localized group and tabs', () => {
      test('should properly create/update/read localized group field', async ({ payload }) => {
        const result = await payload.create({
          collection: groupSlug,
          data: {
            groupLocalized: {
              title: 'hello en',
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result.groupLocalized?.title).toBe('hello en')

        await payload.update({
          id: result.id,
          collection: groupSlug,
          data: {
            groupLocalized: {
              title: 'hello es',
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docEn = await payload.findByID({
          id: result.id,
          collection: groupSlug,
          locale: englishLocale,
          overrideAccess: true,
        })
        const docEs = await payload.findByID({
          id: result.id,
          collection: groupSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(docEn.groupLocalized.title).toBe('hello en')
        expect(docEs.groupLocalized.title).toBe('hello es')
      })

      test('should properly create/update/read localized field inside of group', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: groupSlug,
          data: {
            group: {
              title: 'hello en',
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result.group.title).toBe('hello en')

        await payload.update({
          id: result.id,
          collection: groupSlug,
          data: {
            group: {
              title: 'hello es',
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docEn = await payload.findByID({
          id: result.id,
          collection: groupSlug,
          locale: englishLocale,
          overrideAccess: true,
        })
        const docEs = await payload.findByID({
          id: result.id,
          collection: groupSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(docEn.group.title).toBe('hello en')
        expect(docEs.group.title).toBe('hello es')
      })

      test('should properly create/update/read deep localized field inside of group', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: groupSlug,
          data: {
            deep: {
              array: [{ title: 'hello en' }],
              blocks: [
                {
                  blockType: 'first',
                  title: 'hello en',
                },
              ],
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result.deep.array[0].title).toBe('hello en')

        await payload.update({
          id: result.id,
          collection: groupSlug,
          data: {
            deep: {
              array: [
                {
                  id: result.deep.array[0].id,
                  title: 'hello es',
                },
              ],
              blocks: [
                {
                  id: result.deep.blocks[0].id,
                  blockType: 'first',
                  title: 'hello es',
                },
              ],
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docEn = await payload.findByID({
          id: result.id,
          collection: groupSlug,
          locale: englishLocale,
          overrideAccess: true,
        })
        const docEs = await payload.findByID({
          id: result.id,
          collection: groupSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(docEn.deep.array[0].title).toBe('hello en')
        expect(docEn.deep.blocks[0].title).toBe('hello en')
        expect(docEs.deep.array[0].title).toBe('hello es')
        expect(docEs.deep.blocks[0].title).toBe('hello es')
      })

      test('should create/updated/read localized group with row field', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'groups',
          data: {
            groupLocalizedRow: {
              text: 'hello world',
            },
          },
          locale: 'en',
          overrideAccess: true,
        })

        expect(doc.groupLocalizedRow.text).toBe('hello world')

        const docES = await payload.update({
          id: doc.id,
          collection: 'groups',
          data: {
            groupLocalizedRow: {
              text: 'hola world or something',
            },
          },
          locale: 'es',
          overrideAccess: true,
        })

        expect(docES.groupLocalizedRow.text).toBe('hola world or something')

        // check if docES didnt break EN
        const docEN = await payload.findByID({
          id: doc.id,
          collection: 'groups',
          locale: 'en',
          overrideAccess: true,
        })
        expect(docEN.groupLocalizedRow.text).toBe('hello world')

        const all = await payload.findByID({
          id: doc.id,
          collection: 'groups',
          locale: 'all',
          overrideAccess: true,
        })

        expect(all.groupLocalizedRow.en.text).toBe('hello world')
        expect(all.groupLocalizedRow.es.text).toBe('hola world or something')
      })

      test('should not crash on empty localized tab', async ({ payload }) => {
        const result = await payload.create({
          collection: tabSlug,
          data: {
            tabLocalized: {},
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result).toBeTruthy()
      })

      test('should properly create/update/read array field inside localized tab field', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: tabSlug,
          data: {
            tabLocalized: {
              title: 'hello en',
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result.tabLocalized?.title).toBe('hello en')

        await payload.update({
          id: result.id,
          collection: tabSlug,
          data: {
            tabLocalized: {
              title: 'hello es',
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docEn = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: englishLocale,
          overrideAccess: true,
        })

        const docEs = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(docEn.tabLocalized.title).toBe('hello en')
        expect(docEs.tabLocalized.title).toBe('hello es')
      })

      test('should properly create/update/read localized tab field', async ({ payload }) => {
        const result = await payload.create({
          collection: tabSlug,
          data: {
            tabLocalized: {
              array: [
                {
                  title: 'hello en',
                },
              ],
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result.tabLocalized.array[0].title).toBe('hello en')

        await payload.update({
          id: result.id,
          collection: tabSlug,
          data: {
            tabLocalized: {
              array: [{ title: 'hello es' }],
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docEn = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: englishLocale,
          overrideAccess: true,
        })

        const docEs = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(docEn.tabLocalized.array[0].title).toBe('hello en')
        expect(docEs.tabLocalized.array[0].title).toBe('hello es')
      })

      test('should properly create/update/read localized field inside of tab', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: tabSlug,
          data: {
            tab: {
              title: 'hello en',
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result.tab.title).toBe('hello en')

        await payload.update({
          id: result.id,
          collection: tabSlug,
          data: {
            tab: {
              title: 'hello es',
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docEn = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: englishLocale,
          overrideAccess: true,
        })
        const docEs = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(docEn.tab.title).toBe('hello en')
        expect(docEs.tab.title).toBe('hello es')
      })

      test('should properly create/update/read deep localized field inside of tab', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: tabSlug,
          data: {
            deep: {
              array: [{ title: 'hello en' }],
              blocks: [
                {
                  blockType: 'first',
                  title: 'hello en',
                },
              ],
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        expect(result.deep.array[0].title).toBe('hello en')

        await payload.update({
          id: result.id,
          collection: tabSlug,
          data: {
            deep: {
              array: [
                {
                  id: result.deep.array[0].id,
                  title: 'hello es',
                },
              ],
              blocks: [
                {
                  id: result.deep.blocks[0].id,
                  blockType: 'first',
                  title: 'hello es',
                },
              ],
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const docEn = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: englishLocale,
          overrideAccess: true,
        })
        const docEs = await payload.findByID({
          id: result.id,
          collection: tabSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(docEn.deep.array[0].title).toBe('hello en')
        expect(docEn.deep.blocks[0].title).toBe('hello en')
        expect(docEs.deep.array[0].title).toBe('hello es')
        expect(docEs.deep.blocks[0].title).toBe('hello es')
      })

      test('should properly isolate locales for a group inside a localized tab', async ({
        payload,
      }) => {
        const docEs = await payload.create({
          collection: tabSlug,
          data: {
            tabLocalized: {
              group: {
                heading: 'Spanish heading',
              },
            },
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        await payload.update({
          id: docEs.id,
          collection: tabSlug,
          data: {
            tabLocalized: {
              group: {
                heading: 'English heading',
              },
            },
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        const readEn = await payload.findByID({
          id: docEs.id,
          collection: tabSlug,
          locale: englishLocale,
          overrideAccess: true,
        })

        const readEs = await payload.findByID({
          id: docEs.id,
          collection: tabSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(readEn.tabLocalized.group.heading).toBe('English heading')
        expect(readEs.tabLocalized.group.heading).toBe('Spanish heading')
      })
    })

    // Nested localized fields do no longer have their localized property stripped in
    // this monorepo, as this is handled at runtime.
    test.describe('nested localized field sanitization', () => {
      test('ensure nested localized fields keep localized property in monorepo', ({ payload }) => {
        const collection = payload.collections['localized-within-localized'].config

        expect(collection.fields[0].tabs[0].fields[0].localized).toBeDefined()
        expect(collection.fields[1].fields[0].localized).toBeDefined()
        expect(collection.fields[2].blocks[0].fields[0].localized).toBeDefined()
        expect(collection.fields[3].fields[0].localized).toBeDefined()
      })
    })

    test.describe('nested blocks', () => {
      let id
      test('should allow creating nested blocks per locale', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'blocks-fields',
          data: {
            content: [
              {
                array: [
                  {
                    link: {
                      label: 'English 1',
                    },
                  },
                  {
                    link: {
                      label: 'English 2',
                    },
                  },
                ],
                blockType: 'blockInsideBlock',
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'hello',
                  },
                ],
              },
            ],
          },
          overrideAccess: true,
        })

        id = doc.id

        const retrievedInEN = await payload.findByID({
          id,
          collection: 'blocks-fields',
          overrideAccess: true,
        })

        await payload.update({
          id,
          collection: 'blocks-fields',
          data: {
            content: [
              {
                array: [
                  {
                    link: {
                      label: 'Spanish 1',
                    },
                  },
                  {
                    link: {
                      label: 'Spanish 2',
                    },
                  },
                ],
                blockType: 'blockInsideBlock',
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'hola',
                  },
                ],
              },
            ],
          },
          locale: 'es',
          overrideAccess: true,
        })

        const retrieved = await payload.findByID({
          id,
          collection: 'blocks-fields',
          locale: 'all',
          overrideAccess: true,
        })

        expect(retrieved.content.en[0].content).toHaveLength(1)
        expect(retrieved.content.es[0].content).toHaveLength(1)

        expect(retrieved.content.en[0].array[0].link.label).toStrictEqual('English 1')
        expect(retrieved.content.en[0].array[1].link.label).toStrictEqual('English 2')

        expect(retrieved.content.es[0].array[0].link.label).toStrictEqual('Spanish 1')
        expect(retrieved.content.es[0].array[1].link.label).toStrictEqual('Spanish 2')
      })
    })

    test.describe('nested arrays', () => {
      test('should not duplicate block rows for blocks within localized array fields', async ({
        payload,
      }) => {
        const randomDoc = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]

        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[1]

        const blocksWithinArrayEN = [
          {
            blockName: '1',
            blockType: 'someBlock',
            myGroup: {
              text: 'hello in english 1',
            },
            relationWithinBlock: randomDoc.id,
          },
          {
            blockName: '2',
            blockType: 'someBlock',
            myGroup: {
              text: 'hello in english 2',
            },
            relationWithinBlock: randomDoc.id,
          },
          {
            blockName: '3',
            blockType: 'someBlock',
            myGroup: {
              text: 'hello in english 3',
            },
            relationWithinBlock: randomDoc.id,
          },
        ]

        const blocksWithinArrayES = [
          {
            blockName: '1',
            blockType: 'someBlock',
            myGroup: {
              text: 'hello in spanish 1',
            },
            relationWithinBlock: randomDoc2.id,
          },
          {
            blockName: '2',
            blockType: 'someBlock',
            myGroup: {
              text: 'hello in spanish 2',
            },
            relationWithinBlock: randomDoc2.id,
          },
          {
            blockName: '3',
            blockType: 'someBlock',
            myGroup: {
              text: 'hello in spanish 3',
            },
            relationWithinBlock: randomDoc2.id,
          },
        ]

        const createdEnDoc = await payload.create({
          collection: 'nested-arrays',
          data: {
            arrayWithBlocks: [
              {
                blocksWithinArray: blocksWithinArrayEN as any,
              },
            ],
          },
          depth: 0,
          locale: 'en',
          overrideAccess: true,
        })

        const updatedEsDoc = await payload.update({
          id: createdEnDoc.id,
          collection: 'nested-arrays',
          data: {
            arrayWithBlocks: [
              {
                blocksWithinArray: blocksWithinArrayES as any,
              },
            ],
          },
          depth: 0,
          locale: 'es',
          overrideAccess: true,
        })

        const esArrayBlocks = updatedEsDoc.arrayWithBlocks[0].blocksWithinArray
        // recursively remove any id field within esArrayRow
        const removeId = (obj) => {
          if (obj instanceof Object) {
            delete obj.id
            Object.values(obj).forEach(removeId)
          }
        }
        removeId(esArrayBlocks)
        removeId(createdEnDoc.arrayWithBlocks[0].blocksWithinArray)

        expect(esArrayBlocks).toEqual(blocksWithinArrayES)
        expect(createdEnDoc.arrayWithBlocks[0].blocksWithinArray).toEqual(blocksWithinArrayEN)

        // pull enDoc again and make sure the update of esDoc did not mess with the data of enDoc
        const enDoc2 = await payload.findByID({
          id: createdEnDoc.id,
          collection: 'nested-arrays',
          depth: 0,
          locale: 'en',
          overrideAccess: true,
        })
        removeId(enDoc2.arrayWithBlocks[0].blocksWithinArray)
        expect(enDoc2.arrayWithBlocks[0].blocksWithinArray).toEqual(blocksWithinArrayEN)
      })

      test('should update localized relation within unLocalized array', async ({ payload }) => {
        const randomTextDoc = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]
        const randomTextDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[1]

        const createdEnDoc = await payload.create({
          collection: 'nested-arrays',
          data: {
            arrayWithLocalizedRelation: [
              {
                localizedRelation: randomTextDoc.id,
              },
            ],
          },
          depth: 0,
          locale: 'en',
          overrideAccess: true,
        })

        const updatedEsDoc = await payload.update({
          id: createdEnDoc.id,
          collection: 'nested-arrays',
          data: {
            arrayWithLocalizedRelation: [
              {
                id: createdEnDoc.arrayWithLocalizedRelation[0].id,
                localizedRelation: randomTextDoc2.id,
              },
            ],
          },
          depth: 0,
          locale: 'es',
          overrideAccess: true,
        })

        expect(updatedEsDoc.arrayWithLocalizedRelation).toHaveLength(1)
        expect(updatedEsDoc.arrayWithLocalizedRelation[0].localizedRelation).toBe(randomTextDoc2.id)

        expect(createdEnDoc.arrayWithLocalizedRelation).toHaveLength(1)
        expect(createdEnDoc.arrayWithLocalizedRelation[0].localizedRelation).toBe(randomTextDoc.id)

        // pull enDoc again and make sure the update of esDoc did not mess with the data of enDoc
        const enDoc2 = await payload.findByID({
          id: createdEnDoc.id,
          collection: 'nested-arrays',
          depth: 0,
          locale: 'en',
          overrideAccess: true,
        })
        expect(enDoc2.arrayWithLocalizedRelation).toHaveLength(1)
        expect(enDoc2.arrayWithLocalizedRelation[0].localizedRelation).toBe(randomTextDoc.id)
      })
    })

    test.describe('nested fields', () => {
      test('should update localized block', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'blocks-fields',
          data: {
            content: [
              {
                blockType: 'blockInsideBlock',
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'some-text',
                  },
                ],
              },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })

        const updated = await payload.update({
          id: doc.id,
          collection: 'blocks-fields',
          data: {
            id: doc.id,
            content: [
              {
                // This can't be added in Postgres because you'd get a duplicate ID error
                // since the parent is localized, and the primary key in the block table
                // consists only of the ID. That's why it's removed in `copyToLocale`.
                // id: doc.content?.[0]?.id,
                array: [],
                blockName: null,
                blockType: 'blockInsideBlock',
                content: [
                  {
                    // Same as above.
                    // id: doc.content?.[0]?.content?.[0]?.id,
                    blockName: null,
                    blockType: 'textBlock',
                    text: 'some-text',
                  },
                ],
              },
            ],
          },
          locale: 'es',
          overrideAccess: true,
        })

        console.dir(updated, { depth: null })

        expect(updated.content?.[0]?.content?.[0]?.text).toBe('some-text')
      })

      test('update specific locale should not erease the others in blocks and arrays', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: 'nested',
          data: {
            blocks: [
              {
                blockType: 'block',
                someText: 'some-block-text-en',
              },
            ],
            topLevelArray: [
              {
                localizedText: 'some-localized-text',
                notLocalizedText: 'some-not-localized-text',
              },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })

        expect(doc.blocks?.[0]?.someText).toBe('some-block-text-en')
        expect(doc.topLevelArray?.[0]?.localizedText).toBe('some-localized-text')
        expect(doc.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text')
        expect(doc.topLevelArray).toHaveLength(1)

        const findAllLocales = await payload.findByID({
          id: doc.id,
          collection: 'nested',
          locale: 'all',
          overrideAccess: true,
        })

        expect(findAllLocales.blocks?.[0]?.someText).toStrictEqual({
          en: 'some-block-text-en',
        })
        expect(findAllLocales.topLevelArray?.[0]?.localizedText).toStrictEqual({
          en: 'some-localized-text',
        })

        const updatedDoc = await payload.update({
          id: doc.id,
          collection: 'nested',
          data: {
            blocks: [
              {
                id: doc.blocks?.[0]?.id,
                blockType: 'block',
                someText: 'some-block-text-es',
              },
            ],
            topLevelArray: [
              {
                id: doc.topLevelArray?.[0]?.id,
                localizedText: 'some-localized-text-es',
                notLocalizedText: 'some-not-localized-text-es',
              },
            ],
          },
          locale: 'es',
          overrideAccess: true,
        })

        expect(updatedDoc.blocks?.[0]?.someText).toBe('some-block-text-es')
        expect(updatedDoc.topLevelArray?.[0]?.localizedText).toBe('some-localized-text-es')
        expect(updatedDoc.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text-es')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'nested',
          locale: 'all',
          overrideAccess: true,
        })

        expect(refreshedDoc.blocks?.[0]?.someText).toStrictEqual({
          en: 'some-block-text-en',
          es: 'some-block-text-es',
        })
        expect(refreshedDoc.topLevelArray?.[0]?.localizedText).toStrictEqual({
          en: 'some-localized-text',
          es: 'some-localized-text-es',
        })
      })

      test('update specific locale should not erease the others in simple fields', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: 'localized-posts',
          data: {
            description: 'some-not-localized-description',
            localizedDescription: 'some-localized-description',
            title: 'some-localized-title',
          },
          locale: 'en',
          overrideAccess: true,
        })

        expect(doc.title).toBe('some-localized-title')
        expect(doc.localizedDescription).toBe('some-localized-description')

        const findAllLocales = await payload.findByID({
          id: doc.id,
          collection: 'localized-posts',
          locale: 'all',
          overrideAccess: true,
        })

        expect(findAllLocales.title).toStrictEqual({
          en: 'some-localized-title',
        })
        expect(findAllLocales.localizedDescription).toStrictEqual({
          en: 'some-localized-description',
        })

        const updatedDoc = await payload.update({
          id: doc.id,
          collection: 'localized-posts',
          data: {
            description: 'some-not-localized-description-es',
            localizedDescription: 'some-localized-description-es',
            title: 'some-localized-title-es',
          },
          locale: 'es',
          overrideAccess: true,
        })

        expect(updatedDoc.title).toBe('some-localized-title-es')
        expect(updatedDoc.localizedDescription).toBe('some-localized-description-es')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'localized-posts',
          locale: 'all',
          overrideAccess: true,
        })

        expect(refreshedDoc.title).toStrictEqual({
          en: 'some-localized-title',
          es: 'some-localized-title-es',
        })
        expect(refreshedDoc.localizedDescription).toStrictEqual({
          en: 'some-localized-description',
          es: 'some-localized-description-es',
        })
      })
      test('should allow for fields which could contain new tables within localized arrays to be stored', async ({
        payload,
      }) => {
        const randomDoc = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]
        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[1]

        const newDoc = await payload.create({
          collection: 'nested-field-tables',
          data: {
            array: [
              {
                hasManyPolyRelation: [
                  {
                    relationTo: 'localized-posts',
                    value: randomDoc.id,
                  },
                  {
                    relationTo: 'localized-posts',
                    value: randomDoc2.id,
                  },
                ],
                hasManyRelation: [randomDoc.id, randomDoc2.id],
                number: [1, 2],
                relation: {
                  relationTo: 'localized-posts',
                  value: randomDoc.id,
                },
                select: ['one'],
                text: ['hello', 'goodbye'],
              },
            ],
          },
          overrideAccess: true,
        })

        await payload.update({
          id: newDoc.id,
          collection: 'nested-field-tables',
          data: {
            array: [
              {
                hasManyPolyRelation: [
                  {
                    relationTo: 'localized-posts',
                    value: randomDoc2.id,
                  },
                  {
                    relationTo: 'localized-posts',
                    value: randomDoc.id,
                  },
                ],
                hasManyRelation: [randomDoc2.id, randomDoc.id],
                number: [3, 4],
                relation: {
                  relationTo: 'localized-posts',
                  value: randomDoc2.id,
                },
                select: ['two', 'three'],
                text: ['hola', 'adios'],
              },
            ],
          },
          locale: 'es',
          overrideAccess: true,
        })

        const retrieved = await payload.findByID({
          id: newDoc.id,
          collection: 'nested-field-tables',
          depth: 0,
          locale: 'all',
          overrideAccess: true,
        })

        expect(retrieved.array.en[0].relation.value).toStrictEqual(randomDoc.id)
        expect(retrieved.array.es[0].relation.value).toStrictEqual(randomDoc2.id)

        expect(retrieved.array.en[0].hasManyRelation).toEqual([randomDoc.id, randomDoc2.id])
        expect(retrieved.array.es[0].hasManyRelation).toEqual([randomDoc2.id, randomDoc.id])

        expect(retrieved.array.en[0].hasManyPolyRelation).toEqual([
          { relationTo: 'localized-posts', value: randomDoc.id },
          { relationTo: 'localized-posts', value: randomDoc2.id },
        ])
        expect(retrieved.array.es[0].hasManyPolyRelation).toEqual([
          { relationTo: 'localized-posts', value: randomDoc2.id },
          { relationTo: 'localized-posts', value: randomDoc.id },
        ])

        expect(retrieved.array.en[0].number).toEqual([1, 2])
        expect(retrieved.array.es[0].number).toEqual([3, 4])

        expect(retrieved.array.en[0].select).toEqual(['one'])
        expect(retrieved.array.es[0].select).toEqual(['two', 'three'])

        expect(retrieved.array.en[0].text).toEqual(['hello', 'goodbye'])
        expect(retrieved.array.es[0].text).toEqual(['hola', 'adios'])
      })

      test('should allow for relationship in new tables within blocks inside of localized blocks to be stored', async ({
        payload,
      }) => {
        const randomDoc = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]
        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[1]

        const docEn = await payload.create({
          collection: 'nested-field-tables',
          data: {
            blocks: [
              {
                blockType: 'block',
                nestedBlocks: [
                  {
                    blockType: 'content',
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                nestedBlocks: [
                  {
                    blockType: 'content',
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                nestedBlocks: [
                  {
                    blockType: 'content',
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
              },
            ],
          },
          depth: 0,
          overrideAccess: true,
        })

        expect(docEn.blocks[0].nestedBlocks[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[1].nestedBlocks[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[2].nestedBlocks[0].relation.value).toBe(randomDoc.id)

        const docEs = await payload.update({
          id: docEn.id,
          collection: 'nested-field-tables',
          data: {
            blocks: [
              {
                blockType: 'block',
                nestedBlocks: [
                  {
                    blockType: 'content',
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                nestedBlocks: [
                  {
                    blockType: 'content',
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                nestedBlocks: [
                  {
                    blockType: 'content',
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
              },
            ],
          },
          depth: 0,
          locale: 'es',
          overrideAccess: true,
        })

        expect(docEs.blocks[0].nestedBlocks[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[1].nestedBlocks[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[2].nestedBlocks[0].relation.value).toBe(randomDoc2.id)

        const docAll = await payload.findByID({
          id: docEn.id,
          collection: 'nested-field-tables',
          depth: 0,
          locale: 'all',
          overrideAccess: true,
        })

        expect(docAll.blocks.en[0].nestedBlocks[0].relation.value).toBe(randomDoc.id)
        expect(docAll.blocks.en[1].nestedBlocks[0].relation.value).toBe(randomDoc.id)
        expect(docAll.blocks.en[2].nestedBlocks[0].relation.value).toBe(randomDoc.id)

        expect(docAll.blocks.es[0].nestedBlocks[0].relation.value).toBe(randomDoc2.id)
        expect(docAll.blocks.es[1].nestedBlocks[0].relation.value).toBe(randomDoc2.id)
        expect(docAll.blocks.es[2].nestedBlocks[0].relation.value).toBe(randomDoc2.id)
      })

      test('should allow for relationship in new tables within arrays inside of localized blocks to be stored', async ({
        payload,
      }) => {
        const randomDoc = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]
        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
            overrideAccess: true,
          })
        ).docs[1]

        const docEn = await payload.create({
          collection: 'nested-field-tables',
          data: {
            blocks: [
              {
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
                blockType: 'block',
              },
              {
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
                blockType: 'block',
              },
              {
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
                blockType: 'block',
              },
            ],
          },
          depth: 0,
          overrideAccess: true,
        })

        expect(docEn.blocks[0].array[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[1].array[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[2].array[0].relation.value).toBe(randomDoc.id)

        const docEs = await payload.update({
          id: docEn.id,
          collection: 'nested-field-tables',
          data: {
            blocks: [
              {
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
                blockType: 'block',
              },
              {
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
                blockType: 'block',
              },
              {
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
                blockType: 'block',
              },
            ],
          },
          depth: 0,
          locale: 'es',
          overrideAccess: true,
        })

        expect(docEs.blocks[0].array[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[1].array[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[2].array[0].relation.value).toBe(randomDoc2.id)

        const docAll = await payload.findByID({
          id: docEn.id,
          collection: 'nested-field-tables',
          depth: 0,
          locale: 'all',
          overrideAccess: true,
        })

        expect(docAll.blocks.en[0].array[0].relation.value).toBe(randomDoc.id)
        expect(docAll.blocks.en[1].array[0].relation.value).toBe(randomDoc.id)
        expect(docAll.blocks.en[2].array[0].relation.value).toBe(randomDoc.id)

        expect(docAll.blocks.es[0].array[0].relation.value).toBe(randomDoc2.id)
        expect(docAll.blocks.es[1].array[0].relation.value).toBe(randomDoc2.id)
        expect(docAll.blocks.es[2].array[0].relation.value).toBe(randomDoc2.id)
      })
    })

    test.describe('localized with unique', () => {
      test('localized with unique should work for each locale', async ({ payload }) => {
        await payload.create({
          collection: 'localized-posts',
          data: {
            unique: 'text',
          },
          locale: 'ar',
          overrideAccess: true,
        })

        await payload.create({
          collection: 'localized-posts',
          data: {
            unique: 'text',
          },
          locale: 'en',
          overrideAccess: true,
        })

        await payload.create({
          collection: 'localized-posts',
          data: {
            unique: 'text',
          },
          locale: 'es',
          overrideAccess: true,
        })

        await expect(
          payload.create({
            collection: 'localized-posts',
            data: {
              unique: 'text',
            },
            locale: 'en',
            overrideAccess: true,
          }),
        ).rejects.toBeTruthy()
      })

      test('should return correct error path without locale suffix for top-level localized unique field', async ({
        payload,
      }) => {
        const uniqueValue = `unique-path-test-${Date.now()}`

        await payload.create({
          collection: localizedPostsSlug,
          data: {
            unique: uniqueValue,
          },
          locale: 'en',
          overrideAccess: true,
        })

        try {
          await payload.create({
            collection: localizedPostsSlug,
            data: {
              unique: uniqueValue,
            },
            locale: 'en',
            overrideAccess: true,
          })
          expect.unreachable('Should have thrown a ValidationError')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          const fieldError = error.data.errors[0]

          expect(fieldError.message).toContain('unique')
          // The path should be the field name without locale suffix

          expect(fieldError.path).toBe('unique')
        }
      })

      test('should return correct error path without locale suffix for localized unique field inside tabs', async ({
        payload,
      }) => {
        const uniqueValue = `seo-unique-test-${Date.now()}`

        const blockData = [{ blockType: 'text', text: 'test' }]

        await payload.create({
          collection: withRequiredLocalizedFields,
          data: {
            nav: {
              layout: blockData,
            },
            seoTitle: uniqueValue,
            title: 'Test title 1',
          },
          locale: 'en',
          overrideAccess: true,
        })

        try {
          await payload.create({
            collection: withRequiredLocalizedFields,
            data: {
              nav: {
                layout: blockData,
              },
              seoTitle: uniqueValue,
              title: 'Test title 2',
            },
            locale: 'en',
            overrideAccess: true,
          })
          expect.unreachable('Should have thrown a ValidationError')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          const fieldError = error.data.errors[0]

          expect(fieldError.message).toContain('unique')
          // The path should be the field name without locale suffix (not "seoTitle.en")

          expect(fieldError.path).toBe('seoTitle')
        }
      })
    })

    test.describe('Copying To Locale', () => {
      let user: User

      test.beforeAll(async ({ payloadInstance: payload }) => {
        user = (
          await payload.find({
            collection: 'users',
            overrideAccess: true,
            where: {
              email: {
                equals: devUser.email,
              },
            },
          })
        ).docs[0] as unknown as User

        user['collection'] = 'users'
      })

      test('should copy to locale', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'localized-posts',
          data: {
            group: {
              children: 'Children',
            },
            localizedCheckbox: true,
            title: 'Hello',
            unique: 'unique-field',
          },
          overrideAccess: true,
        })

        const req = await createPayloadReq({ payload, user })

        const res = (await copyDataFromLocaleHandler({
          collectionSlug: 'localized-posts',
          docID: doc.id,
          fromLocale: 'en',
          req,
          toLocale: 'es',
        })) as LocalizedPost

        expect(res.title).toBe('Hello')
        expect(res.group.children).toBe('Children')
        expect(res.unique).toBe('unique-field')
        expect(res.localizedCheckbox).toBe(true)
      })

      test('should copy block to locale', async ({ payload }) => {
        // This was previously an e2e test but it was migrated to int
        // because at the moment only int tests run in Postgres in CI,
        // and that's where the bug occurs.
        const doc = await payload.create({
          collection: 'blocks-fields',
          data: {
            content: [
              {
                blockType: 'blockInsideBlock',
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'some-text',
                  },
                ],
              },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })

        const req = await createPayloadReq({ payload, user })

        const res = (await copyDataFromLocaleHandler({
          collectionSlug: 'blocks-fields',
          docID: doc.id,
          fromLocale: 'en',
          req,
          toLocale: 'es',
        })) as BlocksField

        expect(res.content?.[0]?.content?.[0]?.text).toBe('some-text')
      })

      test('should copy block inside tab to locale', async ({ payload }) => {
        // This was previously an e2e test but it was migrated to int
        // because at the moment only int tests run in Postgres in CI,
        // and that's where the bug occurs.
        const doc = await payload.create({
          collection: 'blocks-fields',
          data: {
            tabContent: [
              {
                blockType: 'blockInsideTab',
                text: 'some-text',
              },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })

        const req = await createPayloadReq({ payload, user })
        const res = (await copyDataFromLocaleHandler({
          collectionSlug: 'blocks-fields',
          docID: doc.id,
          fromLocale: 'en',
          req,
          toLocale: 'pt',
        })) as BlocksField

        expect(res.tabContent?.[0]?.text).toBe('some-text')
      })

      test('should copy localized nested to arrays', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'nested',
          data: {
            topLevelArray: [
              {
                localizedText: 'some-localized-text',
                notLocalizedText: 'some-not-localized-text',
              },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })

        const req = await createPayloadReq({ payload, user })

        const res = (await copyDataFromLocaleHandler({
          collectionSlug: 'nested',
          docID: doc.id,
          fromLocale: 'en',
          req,
          toLocale: 'es',
        })) as Nested

        expect(res.topLevelArray?.[0]?.localizedText).toBe('some-localized-text')
        expect(res.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'nested',
          overrideAccess: true,
        })

        // The source data should remain unchanged
        expect(refreshedDoc.topLevelArray?.[0]?.localizedText).toBe('some-localized-text')
        expect(refreshedDoc.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text')
        expect(refreshedDoc.topLevelArray).toHaveLength(1)
      })

      test('should copy localized arrays', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'nested',
          data: {
            topLevelArrayLocalized: [
              {
                text: 'some-text',
              },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })

        const req = await createPayloadReq({ payload, user })

        const res = (await copyDataFromLocaleHandler({
          collectionSlug: 'nested',
          docID: doc.id,
          fromLocale: 'en',
          req,
          toLocale: 'es',
        })) as Nested

        expect(res.topLevelArrayLocalized?.[0]?.text).toBe('some-text')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'nested',
          overrideAccess: true,
        })

        // The source data should remain unchanged
        expect(refreshedDoc.topLevelArrayLocalized?.[0]?.text).toBe('some-text')
      })

      test('should copy nested arrays through tabs within localized arrays', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: arrayCollectionSlug,
          data: {
            items: [
              {
                nestedItems: [
                  {
                    text: 'nested text',
                  },
                ],
              },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })

        try {
          const req = await createPayloadReq({ payload, user })

          const res = (await copyDataFromLocaleHandler({
            collectionSlug: arrayCollectionSlug,
            docID: doc.id,
            fromLocale: 'en',
            req,
            toLocale: 'es',
          })) as ArrayField

          expect(res.items?.[0]?.nestedItems?.[0]?.text).toBe('nested text')
        } finally {
          await payload.delete({
            id: doc.id,
            collection: arrayCollectionSlug,
            overrideAccess: true,
          })
        }
      })

      test('should copy to locale without losing data when autosave and drafts are enabled', async ({
        payload,
      }) => {
        // The blocks-fields collection has versions.drafts.autosave: true
        // This test verifies that copyToLocale doesn't cause data loss
        // when operating on a collection with autosave enabled

        // Create a document with content in en locale
        const doc = await payload.create({
          collection: 'blocks-fields',
          data: {
            content: [
              {
                blockType: 'blockInsideBlock',
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'Nested English text',
                  },
                ],
                text: 'English block text',
              },
            ],
            title: 'English Title',
          },
          locale: 'en',
          overrideAccess: true,
        })

        // Add content to Spanish locale separately
        await payload.update({
          id: doc.id,
          collection: 'blocks-fields',
          data: {
            content: [
              {
                blockType: 'blockInsideBlock',
                text: 'Spanish block text',
              },
            ],
            title: 'Spanish Title',
          },
          locale: 'es',
          overrideAccess: true,
        })

        // Verify initial state - English data should exist
        const enDocBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
          overrideAccess: true,
        })

        expect(enDocBefore.title).toBe('English Title')
        expect(enDocBefore.content?.[0]?.text).toBe('English block text')

        // Copy data from en to es
        const req = await createPayloadReq({ payload, user })

        await copyDataFromLocaleHandler({
          collectionSlug: 'blocks-fields',
          docID: doc.id,
          fromLocale: 'en',
          overrideData: true,
          req,
          toLocale: 'es',
        })

        // CRITICAL: Verify English data is NOT lost after copy operation
        const enDocAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
          overrideAccess: true,
        })

        expect(enDocAfter.title).toBe('English Title')
        expect(enDocAfter.content?.[0]?.text).toBe('English block text')
        expect(enDocAfter.content?.[0]?.content?.[0]?.text).toBe('Nested English text')

        // Verify Spanish locale received the copied data (as a draft)
        const esDocAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        expect(esDocAfter.title).toBe('English Title')
        expect(esDocAfter.content?.[0]?.text).toBe('English block text')
      })

      test('should copy to locale without losing draft data when autosave is enabled', async ({
        payload,
      }) => {
        // Create a document with draft content
        const doc = await payload.create({
          collection: 'blocks-fields',
          data: {
            content: [
              {
                blockType: 'blockInsideBlock',
                text: 'Draft block text',
              },
            ],
            title: 'Draft English Title',
          },
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        // Verify draft exists
        const draftBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        expect(draftBefore.title).toBe('Draft English Title')

        // Copy draft data to another locale
        const req = await createPayloadReq({ payload, user })

        await copyDataFromLocaleHandler({
          collectionSlug: 'blocks-fields',
          docID: doc.id,
          fromLocale: 'en',
          req,
          toLocale: 'es',
        })

        // Verify the source draft is not lost
        const draftAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        expect(draftAfter.title).toBe('Draft English Title')
        expect(draftAfter.content?.[0]?.text).toBe('Draft block text')
      })

      test('should not overwrite published content when source has both published and draft versions', async ({
        payload,
      }) => {
        // Create published doc in en
        const doc = await payload.create({
          collection: 'blocks-fields',
          data: {
            title: 'Published EN',
          },
          locale: 'en',
          overrideAccess: true,
        })

        // Create draft with different content
        await payload.update({
          id: doc.id,
          collection: 'blocks-fields',
          data: {
            title: 'Draft EN',
          },
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        // Verify both published and draft exist with different content
        const enPublishedBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          draft: false,
          locale: 'en',
          overrideAccess: true,
        })
        const enDraftBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        expect(enPublishedBefore.title).toBe('Published EN')
        expect(enDraftBefore.title).toBe('Draft EN')

        // Copy to another locale using the actual handler
        const req = await createPayloadReq({ payload, user })

        await copyDataFromLocaleHandler({
          collectionSlug: 'blocks-fields',
          docID: doc.id,
          fromLocale: 'en',
          overrideData: true,
          req,
          toLocale: 'es',
        })

        // Verify published content in source locale is NOT overwritten
        const enPublishedAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          draft: false,
          locale: 'en',
          overrideAccess: true,
        })

        expect(enPublishedAfter.title).toBe('Published EN')
      })
    })

    test.describe('Multiple fallback locales', () => {
      test.describe('Local API', () => {
        test.describe('Collections', () => {
          test('should allow fallback locale to be an array', async ({ payload }) => {
            const result = await payload.findByID({
              id: postWithLocalizedData.id,
              collection,
              fallbackLocale: [spanishLocale, englishLocale],
              locale: portugueseLocale,
              overrideAccess: true,
            })

            expect(result).toBeDefined()
            expect((result as any).title).toBe(spanishTitle)
          })

          test('should pass over fallback locales until it finds one that exists', async ({
            payload,
          }) => {
            const result = await payload.findByID({
              id: postWithLocalizedData.id,
              collection,
              fallbackLocale: ['hu', 'ar', spanishLocale],
              locale: portugueseLocale,
              overrideAccess: true,
            })

            expect(result).toBeDefined()
            expect((result as any).title).toBe(spanishTitle)
          })

          test('should return undefined if no fallback locales exist', async ({ payload }) => {
            const result = await payload.findByID({
              id: postWithLocalizedData.id,
              collection,
              fallbackLocale: ['hu', 'ar'],
              locale: portugueseLocale,
              overrideAccess: true,
            })

            expect(result).toBeDefined()
            expect((result as any).title).not.toBeDefined()
          })
        })

        test.describe('Globals', () => {
          test('should allow fallback locale to be an array', async ({ payload }) => {
            const result = await payload.findGlobal({
              slug: global,
              fallbackLocale: [spanishLocale, englishLocale],
              locale: portugueseLocale,
              overrideAccess: true,
            })

            expect(result).toBeDefined()
            expect(result.text).toBe(spanishTitle)
          })

          test('should pass over fallback locales until it finds one that exists', async ({
            payload,
          }) => {
            const result = await payload.findGlobal({
              slug: global,
              fallbackLocale: ['hu', spanishLocale],
              locale: portugueseLocale,
              overrideAccess: true,
            })
            expect(result).toBeDefined()
            expect(result.text).toBe(spanishTitle)
          })

          test('should return undefined if no fallback locales exist', async ({ payload }) => {
            const result = await payload.findGlobal({
              slug: global,
              fallbackLocale: ['hu', 'ar'],
              locale: portugueseLocale,
              overrideAccess: true,
            })

            expect(result).toBeDefined()
            expect(result.text).not.toBeDefined()
          })
        })
      })

      test.describe('REST API', () => {
        test.describe('Collections', () => {
          test('should allow fallback locale to be an array', async ({ restClient }) => {
            const response = await restClient.GET(
              `/${collection}/${postWithLocalizedData.id}?locale=pt&fallbackLocale[]=es&fallbackLocale[]=en`,
            )

            expect(response.status).toBe(200)
            const result = await response.json()

            expect(result.title).toEqual(spanishTitle)
          })

          test('should pass over fallback locales until it finds one that exists', async ({
            restClient,
          }) => {
            const response = await restClient.GET(
              `/${collection}/${postWithLocalizedData.id}?locale=pt&fallbackLocale[]=hu&fallbackLocale[]=ar&fallbackLocale[]=es`,
            )

            expect(response.status).toBe(200)
            const result = await response.json()

            expect(result.title).toEqual(spanishTitle)
          })

          test('should return undefined if no fallback locales exist', async ({ restClient }) => {
            const response = await restClient.GET(
              `/${collection}/${postWithLocalizedData.id}?locale=pt&fallbackLocale[]=hu&fallbackLocale[]=ar`,
            )

            expect(response.status).toBe(200)
            const result = await response.json()

            expect(result.title).not.toBeDefined()
          })
        })

        test.describe('Globals', () => {
          test('should allow fallback locale to be an array', async ({ restClient }) => {
            const response = await restClient.GET(
              `/globals/${global}?locale=pt&fallbackLocale[]=es&fallbackLocale[]=en`,
            )

            expect(response.status).toBe(200)
            const result = await response.json()
            expect(result.text).toBe(spanishTitle)
          })

          test('should pass over fallback locales until it finds one that exists', async ({
            restClient,
          }) => {
            const response = await restClient.GET(
              `/globals/${global}?locale=pt&fallbackLocale[]=hu&fallbackLocale[]=ar&fallbackLocale[]=es`,
            )

            expect(response.status).toBe(200)
            const result = await response.json()

            expect(result.text).toBe(spanishTitle)
          })

          test('should return undefined if no fallback locales exist', async ({ restClient }) => {
            const response = await restClient.GET(
              `/globals/${global}?locale=pt&fallbackLocale[]=hu&fallbackLocale[]=ar`,
            )

            expect(response.status).toBe(200)
            const result = await response.json()

            expect(result.title).not.toBeDefined()
          })
        })
      })

      test.describe('GraphQL', () => {
        test.describe('Collections', () => {
          test('should allow fallback locale to be an array', async ({ payload, restClient }) => {
            const query = `
      {
        LocalizedPost(id: ${idToString(postWithLocalizedData.id, payload)}, locale: pt) {
          title
        }
      }
      `

            const { data } = await restClient
              .GRAPHQL_POST({
                body: JSON.stringify({ query }),
                query: { fallbackLocale: ['es', 'en'], locale: 'pt' },
              })
              .then((res) => res.json())
            console.log(data)

            expect(data.LocalizedPost.title).toStrictEqual(spanishTitle)
          })

          test('should pass over fallback locales until it finds one that exists', async ({
            payload,
            restClient,
          }) => {
            const query = `
      {
        LocalizedPost(id: ${idToString(postWithLocalizedData.id, payload)}, locale: pt) {
          title
        }
      }
      `

            const { data: queryResult } = await restClient
              .GRAPHQL_POST({
                body: JSON.stringify({ query }),
                query: { fallbackLocale: ['hu', 'ar', 'es'], locale: 'pt' },
              })
              .then((res) => res.json())

            expect(queryResult.LocalizedPost.title).toBe(spanishTitle)
          })

          test('should return null if no fallback locales exist', async ({
            payload,
            restClient,
          }) => {
            const query = `
      {
        LocalizedPost(id: ${idToString(postWithLocalizedData.id, payload)}, locale: pt) {
          title
        }
      }
      `

            const { data: queryResult } = await restClient
              .GRAPHQL_POST({
                body: JSON.stringify({ query }),
                query: { fallbackLocale: ['hu', 'ar'], locale: 'pt' },
              })
              .then((res) => res.json())

            expect(queryResult.LocalizedPost.title).toBeNull()
          })
        })

        test.describe('Globals', () => {
          test('should allow fallback locale to be an array', async ({ restClient }) => {
            const query = `query {
              GlobalText {
                text
              }
            }`

            const { data: queryResult } = await restClient
              .GRAPHQL_POST({
                body: JSON.stringify({ query }),
                query: { fallbackLocale: ['es', 'en'], locale: 'pt' },
              })
              .then((res) => res.json())

            expect(queryResult.GlobalText.text).toBe(spanishTitle)
          })

          test('should pass over fallback locales until it finds one that exists', async ({
            restClient,
          }) => {
            const query = `query {
              GlobalText {
                text
              }
            }`

            const { data: queryResult } = await restClient
              .GRAPHQL_POST({
                body: JSON.stringify({ query }),
                query: { fallbackLocale: ['hu', 'ar', 'es'], locale: 'pt' },
              })
              .then((res) => res.json())

            expect(queryResult.GlobalText.text).toBe(spanishTitle)
          })

          test('should return null if no fallback locales exist', async ({ restClient }) => {
            const query = `query {
              GlobalText {
                text
              }
            }`

            const { data: queryResult } = await restClient
              .GRAPHQL_POST({
                body: JSON.stringify({ query }),
                query: { fallbackLocale: ['hu', 'ar'], locale: 'pt' },
              })
              .then((res) => res.json())

            expect(queryResult.GlobalText.text).toBeNull()
          })
        })
      })
    })
  })

  test.describe('Localization with fallback false', () => {
    let post1: LocalizedPost
    let postWithLocalizedData: LocalizedPost

    test.beforeAll(async ({ payloadInstance: payload }) => {
      if (payload.config.localization) {
        payload.config.localization.fallback = false
      }

      post1 = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
        overrideAccess: true,
      })

      postWithLocalizedData = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
        overrideAccess: true,
      })

      await payload.update({
        id: postWithLocalizedData.id,
        collection,
        data: {
          title: spanishTitle,
        },
        locale: spanishLocale,
        overrideAccess: true,
      })
    })

    test.describe('fallback locale', () => {
      test('create english', async ({ payload }) => {
        const allDocs = await payload.find({
          collection,
          overrideAccess: true,
          where: {
            title: { equals: post1.title },
          },
        })
        expect(allDocs.docs).toContainEqual(expect.objectContaining(post1))
      })

      test('add spanish translation', async ({ payload }) => {
        const updated = await payload.update({
          id: post1.id,
          collection,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(updated.title).toEqual(spanishTitle)

        const localized: any = await payload.findByID({
          id: post1.id,
          collection,
          locale: 'all',
          overrideAccess: true,
        })

        expect(localized.title.en).toEqual(englishTitle)
        expect(localized.title.es).toEqual(spanishTitle)
      })

      test('should not fallback to english', async ({ payload }) => {
        const retrievedDoc = await payload.findByID({
          id: post1.id,
          collection,
          locale: portugueseLocale,
          overrideAccess: true,
        })

        expect(retrievedDoc.title).not.toBeDefined()
      })

      test('should fallback to english with explicit fallbackLocale', async ({ payload }) => {
        const fallbackDoc = await payload.findByID({
          id: post1.id,
          collection,
          fallbackLocale: englishLocale,
          locale: portugueseLocale,
          overrideAccess: true,
        })

        expect(fallbackDoc.title).toBe(englishTitle)
      })

      test('should not fallback to spanish translation and no explicit fallback is provided', async ({
        payload,
      }) => {
        const localizedFallback: any = await payload.findByID({
          id: postWithLocalizedData.id,
          collection,
          locale: portugueseLocale,
          overrideAccess: true,
        })

        expect(localizedFallback.title).not.toBeDefined()
      })

      test('should respect fallback none', async ({ payload }) => {
        const localizedFallback: any = await payload.findByID({
          id: postWithLocalizedData.id,
          collection,
          fallbackLocale: false,
          locale: portugueseLocale,
          overrideAccess: true,
        })

        expect(localizedFallback.title).not.toBeDefined()
      })

      test('should respect fallback: false on relationship values', async ({ payload }) => {
        const originalPost = await payload.create({
          collection: allFieldsLocalizedSlug,
          data: {
            text: 'Post EN',
          },
          locale: 'en',
          overrideAccess: true,
        })

        await payload.update({
          id: originalPost.id,
          collection: allFieldsLocalizedSlug,
          data: {
            selfRelation: originalPost.id,
          },
          locale: 'en',
          overrideAccess: true,
        })

        const spanishPostWithEnglishFallback = await payload.findByID({
          id: originalPost.id,
          collection: allFieldsLocalizedSlug,
          fallbackLocale: 'en',
          locale: 'es',
          overrideAccess: true,
        })

        expect(spanishPostWithEnglishFallback.text).toBe('Post EN')

        const spanishPostWithNoFallback = await payload.findByID({
          id: originalPost.id,
          collection: allFieldsLocalizedSlug,
          fallbackLocale: false,
          locale: 'es',
          overrideAccess: true,
        })

        expect(spanishPostWithNoFallback?.selfRelation?.text).toBeUndefined()
      })
    })

    test.afterAll(({ payloadInstance }) => {
      if (payloadInstance.config.localization) {
        payloadInstance.config.localization.fallback = true
      }
    })
  })

  test.describe('Localized data shape', () => {
    test.beforeEach(async ({ payload }) => {
      await payload.delete({
        collection: allFieldsLocalizedSlug,
        overrideAccess: true,
        where: {
          id: {
            exists: true,
          },
        },
      })
    })
    test('should only nest the top level localized field values under locale keys', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: allFieldsLocalizedSlug,
        data: {
          _status: 'draft',
          g1: {
            g2: {
              g2a1: [{ text: 'EN Deep 1' }, { text: 'EN Deep 2' }],
            },
          },
          localizedArray: [{ item: 'EN Item 1' }, { item: 'EN Item 2' }],
          localizedBlocks: [
            { blockType: 'localizedTextBlock', text: 'EN Text' },
            { blockType: 'nestedBlock', nestedArray: [{ item: 'EN Nested' }] },
          ],
          localizedGroup: {
            description: 'EN Description',
            title: 'EN Title',
          },
          localizedTab: {
            tabText: 'EN Tab Text',
          },
          nonLocalizedArray: [{ localizedItem: 'EN Item 1' }, { localizedItem: 'EN Item 2' }],
          nonLocalizedGroup: {
            localizedText: 'EN Localized',
            nonLocalizedText: 'Shared Text',
          },
          number: 100,
          select: 'option1',
          t1: {
            t2: {
              text: 'EN Deep Text',
            },
          },
          text: 'English text',
        },
        locale: 'en',
        overrideAccess: true,
      })

      const allLocalesDoc = await payload.findByID({
        id: doc.id,
        collection: allFieldsLocalizedSlug,
        locale: 'all',
        overrideAccess: true,
      })

      // Verify simple localized fields have locale keys at top level
      expect((allLocalesDoc.text as any).en).toBe('English text')
      expect((allLocalesDoc.text as any).es).toBeUndefined()
      expect((allLocalesDoc.number as any).en).toBe(100)
      expect((allLocalesDoc.select as any).en).toBe('option1')

      // Verify localized group has locale keys at top level, children do not
      expect((allLocalesDoc.localizedGroup as any).en).toBeDefined()
      expect((allLocalesDoc.localizedGroup as any).en.title).toBe('EN Title')
      expect((allLocalesDoc.localizedGroup as any).en.description).toBe('EN Description')
      expect((allLocalesDoc.localizedGroup as any).es).toBeUndefined()

      // Verify non-localized group with localized children
      expect(allLocalesDoc.nonLocalizedGroup!.nonLocalizedText).toBe('Shared Text')
      expect((allLocalesDoc.nonLocalizedGroup!.localizedText as any).en).toBe('EN Localized')
      expect((allLocalesDoc.nonLocalizedGroup!.localizedText as any).es).toBeUndefined()

      // Verify localized array has locale keys at top level, items do not
      expect((allLocalesDoc.localizedArray as any).en).toHaveLength(2)
      expect((allLocalesDoc.localizedArray as any).en[0].item).toBe('EN Item 1')
      expect((allLocalesDoc.localizedArray as any).en[1].item).toBe('EN Item 2')
      expect((allLocalesDoc.localizedArray as any).es).toBeUndefined()

      // Verify non-localized array with localized children
      expect(allLocalesDoc.nonLocalizedArray).toHaveLength(2)
      expect((allLocalesDoc.nonLocalizedArray?.[0]!.localizedItem as any).en).toBe('EN Item 1')
      expect((allLocalesDoc.nonLocalizedArray?.[0]!.localizedItem as any).es).toBeUndefined()

      // Verify localized blocks have locale keys at top level, nested fields do not
      expect((allLocalesDoc.localizedBlocks as any).en).toHaveLength(2)
      expect((allLocalesDoc.localizedBlocks as any).en[0].text).toBe('EN Text')
      expect((allLocalesDoc.localizedBlocks as any).en[1].nestedArray[0].item).toBe('EN Nested')
      expect((allLocalesDoc.localizedBlocks as any).es).toBeUndefined()

      // Verify localized named tabs have locale keys at top level
      expect((allLocalesDoc.localizedTab as any).en).toBeDefined()
      expect((allLocalesDoc.localizedTab as any).en.tabText).toBe('EN Tab Text')
      expect((allLocalesDoc.localizedTab as any).es).toBeUndefined()

      // Verify deeply nested localization has locale keys only at topmost localized field
      expect((allLocalesDoc.g1 as any).en).toBeDefined()
      expect((allLocalesDoc.g1 as any).g2).toBeUndefined()
      expect((allLocalesDoc.g1 as any).en.g2.g2a1).toHaveLength(2)
      expect((allLocalesDoc.g1 as any).en.g2.g2a1[0].text).toBe('EN Deep 1')
      expect((allLocalesDoc.g1 as any).es).toBeUndefined()

      // Verify deeply nested localization in tab has locale keys only at topmost localized field
      expect((allLocalesDoc.t1 as any).en).toBeDefined()
      expect((allLocalesDoc.t1 as any).t2).toBeUndefined()
      expect((allLocalesDoc.t1 as any).en.t2.text).toBe('EN Deep Text')
      expect((allLocalesDoc.t1 as any).es).toBeUndefined()
    })
  })

  test.describe('Localization like fields', () => {
    test('should not localize fields that merely resemble localization fields', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: noLocalizedFieldsCollectionSlug,
        data: {
          group: {
            en: {
              text: 'some text',
            },
          },
          text: 'title',
        },
        overrideAccess: true,
      })

      const queriedDoc = await payload.find({
        collection: noLocalizedFieldsCollectionSlug,
        overrideAccess: true,
        where: {
          'group.en.text': { equals: 'some text' },
        },
      })

      expect(queriedDoc.docs).toHaveLength(1)
      expect(queriedDoc.docs[0]!.id).toBe(doc.id)
    })
  })

  test.describe('localize status', () => {
    test.describe('publication authorization', () => {
      const createdDocuments: Array<{ collection: string; id: number | string }> = []

      test.afterEach(async ({ payload }) => {
        for (const { id, collection } of createdDocuments) {
          await payload.delete({ id, collection: collection as any, overrideAccess: true })
        }
        createdDocuments.length = 0
      })

      test('should authorize publishAllLocales during collection create', async ({ payload }) => {
        await expect(
          payload.create({
            collection: publicationAccessSlug as any,
            data: { title: 'unauthorized publication' },
            locale: defaultLocale,
            overrideAccess: false,
            publishAllLocales: true,
          }),
        ).rejects.toThrow()
      })

      test('should expose publishAllLocales intent to collection create beforeOperation hooks', async ({
        payload,
      }) => {
        await expect(
          payload.create({
            collection: publicationBeforeOperationSlug as any,
            data: { title: 'unauthorized publication' },
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication is not allowed in beforeOperation')
      })

      test('should authorize publishAllLocales during collection update by ID', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationAccessSlug as any,
          data: { _status: 'draft', title: 'draft' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAccessSlug })

        await expect(
          payload.update({
            id: doc.id,
            collection: publicationAccessSlug as any,
            data: {},
            locale: defaultLocale,
            overrideAccess: false,
            publishAllLocales: true,
          }),
        ).rejects.toThrow()
      })

      test('should authorize unpublishAllLocales during collection update by ID', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationAccessSlug as any,
          data: { _status: 'published', title: 'published' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAccessSlug })

        await expect(
          payload.update({
            id: doc.id,
            collection: publicationAccessSlug as any,
            data: {},
            locale: defaultLocale,
            overrideAccess: false,
            unpublishAllLocales: true,
          }),
        ).rejects.toThrow()
      })

      test('should expose publishAllLocales intent to collection update beforeOperation hooks', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationBeforeOperationSlug as any,
          data: { _status: 'draft', title: 'draft' },
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationBeforeOperationSlug })

        await expect(
          payload.update({
            id: doc.id,
            collection: publicationBeforeOperationSlug as any,
            data: {},
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication is not allowed in beforeOperation')
      })

      test('should pass publication data to collection bulk update access', async ({ payload }) => {
        const doc = await payload.create({
          collection: publicationAccessSlug as any,
          data: { _status: 'draft', title: 'bulk draft' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAccessSlug })

        await expect(
          payload.update({
            collection: publicationAccessSlug as any,
            data: { _status: 'published' },
            overrideAccess: false,
            where: { id: { equals: doc.id } },
          }),
        ).rejects.toThrow()
      })

      test('should authorize publishAllLocales during collection bulk update', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationAccessSlug as any,
          data: { _status: 'draft', title: 'bulk draft' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAccessSlug })

        await expect(
          payload.update({
            collection: publicationAccessSlug as any,
            data: {},
            locale: defaultLocale,
            overrideAccess: false,
            publishAllLocales: true,
            where: { id: { equals: doc.id } },
          }),
        ).rejects.toThrow()
      })

      test('should expose publishAllLocales intent to collection bulk beforeOperation hooks', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationBeforeOperationSlug as any,
          data: { _status: 'draft', title: 'bulk draft' },
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationBeforeOperationSlug })

        await expect(
          payload.update({
            collection: publicationBeforeOperationSlug as any,
            data: {},
            overrideAccess: true,
            publishAllLocales: true,
            where: { id: { equals: doc.id } },
          }),
        ).rejects.toThrow('Publication is not allowed in beforeOperation')
      })

      test('should authorize publishAllLocales during global update', async ({ payload }) => {
        await payload.updateGlobal({
          slug: publicationAccessGlobalSlug as any,
          data: { _status: 'draft', title: 'draft' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: false,
        })

        await expect(
          payload.updateGlobal({
            slug: publicationAccessGlobalSlug as any,
            data: {},
            locale: defaultLocale,
            overrideAccess: false,
            publishAllLocales: true,
          }),
        ).rejects.toThrow()
      })

      test('should expose publishAllLocales intent to global beforeOperation hooks', async ({
        payload,
      }) => {
        await payload.updateGlobal({
          slug: publicationBeforeOperationGlobalSlug as any,
          data: { _status: 'draft', title: 'draft' },
          overrideAccess: true,
          publishAllLocales: false,
        })

        await expect(
          payload.updateGlobal({
            slug: publicationBeforeOperationGlobalSlug as any,
            data: {},
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication is not allowed in beforeOperation')
      })

      test('should preserve global beforeOperation sanitization of publishAllLocales', async ({
        payload,
      }) => {
        await payload.updateGlobal({
          slug: publicationBeforeOperationSanitizeGlobalSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        await payload.updateGlobal({
          slug: publicationBeforeOperationSanitizeGlobalSlug as any,
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await payload.updateGlobal({
          slug: publicationBeforeOperationSanitizeGlobalSlug as any,
          context: { sanitizePublicationIntent: true },
          data: {},
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: true,
        })

        const unchanged = await payload.findGlobal({
          slug: publicationBeforeOperationSanitizeGlobalSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('published')
        expect(unchanged._status[spanishLocale]).toBe('draft')
      })

      test('should preserve async sibling field hook removal of publishAllLocales intent', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationAsyncFieldHookSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAsyncFieldHookSlug })
        await payload.update({
          id: doc.id,
          collection: publicationAsyncFieldHookSlug as any,
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: publicationAsyncFieldHookSlug as any,
          context: { removePublicationIntent: true },
          data: {},
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: true,
        })

        const unchanged = await payload.findByID({
          id: doc.id,
          collection: publicationAsyncFieldHookSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('published')
        expect(unchanged._status[spanishLocale]).toBe('draft')
      })

      test('should remove synthesized status when beforeOperation changes the update to a draft', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationAsyncFieldHookSlug as any,
          data: { _status: 'draft', title: 'draft' },
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAsyncFieldHookSlug })

        await payload.update({
          id: doc.id,
          collection: publicationAsyncFieldHookSlug as any,
          context: { saveAsDraft: true },
          data: {},
          overrideAccess: true,
          publishAllLocales: true,
        })

        const unchanged = await payload.findByID({
          id: doc.id,
          collection: publicationAsyncFieldHookSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('draft')
        expect(unchanged._status[spanishLocale]).not.toBe('published')
      })

      test('should restore an explicit status when beforeOperation neutralizes the publish flag', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationAsyncFieldHookSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAsyncFieldHookSlug })

        // The caller sends an explicit `_status: 'draft'` alongside `publishAllLocales: true`.
        // The synthesized 'published' overwrites it before beforeOperation, then the saveAsDraft
        // hook clears the publish flag. The explicit 'draft' must be restored (hadStatus branch),
        // and the neutralized publish intent must not leak to the other locale.
        await payload.update({
          id: doc.id,
          collection: publicationAsyncFieldHookSlug as any,
          context: { saveAsDraft: true },
          data: { _status: 'draft' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: true,
        })

        const unchanged = await payload.findByID({
          id: doc.id,
          collection: publicationAsyncFieldHookSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('draft')
        expect(unchanged._status[spanishLocale]).toBe('published')
      })

      test('should respect _status field access when unpublishing all locales', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'published', title: 'published' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationFieldAccessSlug })

        await payload.update({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          data: {},
          locale: defaultLocale,
          overrideAccess: false,
          unpublishAllLocales: true,
        })

        const unchanged = await payload.findByID({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          draft: false,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('published')
        expect(unchanged._status[spanishLocale]).toBe('published')
      })

      test('should not infer field access from an already-published active locale', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationFieldAccessSlug })

        await payload.update({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          context: { comparePublicationStatus: true },
          data: {},
          locale: defaultLocale,
          overrideAccess: false,
          publishAllLocales: true,
        })

        const unchanged = await payload.findByID({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('published')
        expect(unchanged._status[spanishLocale]).toBe('draft')
      })

      test('should not infer field access from an already-draft active locale', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationFieldAccessSlug })

        await payload.update({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'draft' },
          draft: true,
          locale: defaultLocale,
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          data: {},
          locale: defaultLocale,
          overrideAccess: false,
          unpublishAllLocales: true,
        })

        const unchanged = await payload.findByID({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('draft')
        expect(unchanged._status[spanishLocale]).toBe('published')
      })

      test('should expose differing locale status to field beforeValidate hooks', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationFieldAccessSlug })
        await payload.update({
          id: doc.id,
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await expect(
          payload.update({
            id: doc.id,
            collection: publicationFieldAccessSlug as any,
            context: { validatePublicationStatus: true },
            data: {},
            locale: defaultLocale,
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication status validation is not allowed')
      })

      test('should not infer create field access from duplicated publication status', async ({
        payload,
      }) => {
        const original = await payload.create({
          collection: publicationFieldAccessSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: original.id, collection: publicationFieldAccessSlug })

        const duplicate = await payload.create({
          collection: publicationFieldAccessSlug as any,
          data: { title: 'duplicate' },
          duplicateFromID: original.id,
          locale: defaultLocale,
          overrideAccess: false,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: duplicate.id, collection: publicationFieldAccessSlug })

        const unchanged = await payload.findByID({
          id: duplicate.id,
          collection: publicationFieldAccessSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('draft')
        expect(unchanged._status[spanishLocale]).toBe('draft')
      })

      test('should not infer global field access from an already-published active locale', async ({
        payload,
      }) => {
        await payload.updateGlobal({
          slug: publicationFieldAccessGlobalSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        await payload.updateGlobal({
          slug: publicationFieldAccessGlobalSlug as any,
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await payload.updateGlobal({
          slug: publicationFieldAccessGlobalSlug as any,
          context: { comparePublicationStatus: true },
          data: {},
          locale: defaultLocale,
          overrideAccess: false,
          publishAllLocales: true,
        })

        const unchanged = await payload.findGlobal({
          slug: publicationFieldAccessGlobalSlug as any,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        expect(unchanged._status[defaultLocale]).toBe('published')
        expect(unchanged._status[spanishLocale]).toBe('draft')
      })

      test('should expose differing global status to field beforeValidate hooks', async ({
        payload,
      }) => {
        await payload.updateGlobal({
          slug: publicationFieldAccessGlobalSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        await payload.updateGlobal({
          slug: publicationFieldAccessGlobalSlug as any,
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await expect(
          payload.updateGlobal({
            slug: publicationFieldAccessGlobalSlug as any,
            context: { validatePublicationStatus: true },
            data: {},
            locale: defaultLocale,
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication status validation is not allowed')
      })

      test('should publish accessible collection locales when locale is all', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: publicationAccessSlug as any,
          data: { _status: 'draft', title: 'draft' },
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAccessSlug })

        await payload.update({
          id: doc.id,
          collection: publicationAccessSlug as any,
          data: {},
          locale: 'all',
          overrideAccess: true,
          publishAllLocales: true,
        })

        const published = await payload.findByID({
          id: doc.id,
          collection: publicationAccessSlug as any,
          draft: false,
          locale: 'all',
          overrideAccess: true,
        })
        expect(published._status[defaultLocale]).toBe('published')
        expect(published._status[spanishLocale]).toBe('published')
        expect(published._status.xx).not.toBe('published')
      })

      test('should publish accessible global locales when locale is all', async ({ payload }) => {
        await payload.updateGlobal({
          slug: globalWithDraftsSlug,
          data: { _status: 'draft', text: 'draft' },
          overrideAccess: true,
          publishAllLocales: false,
        })

        await payload.updateGlobal({
          slug: globalWithDraftsSlug,
          data: {},
          locale: 'all',
          overrideAccess: true,
          publishAllLocales: true,
        })

        const published = await payload.findGlobal({
          slug: globalWithDraftsSlug,
          draft: false,
          locale: 'all',
          overrideAccess: true,
        })
        expect(published._status[defaultLocale]).toBe('published')
        expect(published._status[spanishLocale]).toBe('published')
        expect(published._status.xx).not.toBe('published')
      })

      test('should expose publishAllLocales intent to collection hooks', async ({ payload }) => {
        const doc = await payload.create({
          collection: publicationHookSlug as any,
          data: { _status: 'draft', title: 'draft' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationHookSlug })

        await expect(
          payload.update({
            id: doc.id,
            collection: publicationHookSlug as any,
            data: {},
            locale: defaultLocale,
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication status changes are not allowed')
      })

      test('should expose differing locale status to collection hooks', async ({ payload }) => {
        const doc = await payload.create({
          collection: publicationHookSlug as any,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        createdDocuments.push({ id: doc.id, collection: publicationHookSlug })
        await payload.update({
          id: doc.id,
          collection: publicationHookSlug as any,
          context: { seedPublicationStatus: true },
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await expect(
          payload.update({
            id: doc.id,
            collection: publicationHookSlug as any,
            data: {},
            locale: defaultLocale,
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication status changes are not allowed')
      })

      test('should expose differing locale status to global hooks', async ({ payload }) => {
        await payload.updateGlobal({
          slug: publicationHookGlobalSlug as any,
          context: { seedPublicationStatus: true },
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
          publishAllLocales: true,
        })
        await payload.updateGlobal({
          slug: publicationHookGlobalSlug as any,
          context: { seedPublicationStatus: true },
          data: { _status: 'draft' },
          draft: true,
          locale: spanishLocale,
          overrideAccess: true,
        })

        await expect(
          payload.updateGlobal({
            slug: publicationHookGlobalSlug as any,
            data: {},
            locale: defaultLocale,
            overrideAccess: true,
            publishAllLocales: true,
          }),
        ).rejects.toThrow('Publication status changes are not allowed')
      })

      test('should reject contradictory all-locale publication flags', async ({ payload }) => {
        const doc = await payload.create({
          collection: publicationAccessSlug as any,
          data: { _status: 'draft', title: 'draft' },
          locale: defaultLocale,
          overrideAccess: true,
          publishAllLocales: false,
        })
        createdDocuments.push({ id: doc.id, collection: publicationAccessSlug })

        await expect(
          payload.update({
            id: doc.id,
            collection: publicationAccessSlug as any,
            data: {},
            overrideAccess: true,
            publishAllLocales: true,
            unpublishAllLocales: true,
          }),
        ).rejects.toThrow()
      })
    })

    test.describe('collections', () => {
      test.describe('on create', () => {
        test('should set other locales to draft upon creation', async ({ payload }) => {
          // Only MongoDB initializes all locales to draft on create
          // SQL databases do not do this otherwise all fields get initialized to null
          if (!mongooseList.includes(process.env.PAYLOAD_DATABASE || '')) {
            return
          }

          const doc = await payload.create({
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'Localized Metadata EN',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })

          const esDoc = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            locale: spanishLocale,
            overrideAccess: true,
          })

          expect(esDoc._status).toContain('draft')
        })

        test('should allow publishing of all locales upon creation', async ({ payload }) => {
          const doc = await payload.create({
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'Localized Metadata EN',
            },
            locale: defaultLocale,
            overrideAccess: true,
            publishAllLocales: true,
          })

          const esDoc = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            locale: spanishLocale,
            overrideAccess: true,
          })
          const allLocalesDoc = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            locale: 'all',
            overrideAccess: true,
          })

          expect(esDoc._status).toContain('published')
          expect(allLocalesDoc._status.xx).not.toBe('published')
        })
      })

      test.describe('querying', () => {
        test('should return correct data based on draft arg', async ({ payload }) => {
          // NOTE: passes in MongoDB, fails in PG
          // -> fails to query on version._status.[localeCode] in `replaceWithDraftIfAvailable` when locale = 'all'

          // create english draft 1
          const doc = await payload.create({
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'draft',
              text: 'english draft 1',
            },
            draft: true,
            locale: defaultLocale,
            overrideAccess: true,
          })
          // update english published 1
          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'english published 1',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })

          // create spanish draft 1
          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'draft',
              text: 'spanish draft 1',
            },
            draft: true,
            locale: spanishLocale,
            overrideAccess: true,
          })
          // update spanish published 1
          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'spanish published 1',
            },
            locale: spanishLocale,
            overrideAccess: true,
          })
          // update spanish draft 2
          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'draft',
              text: 'spanish draft 2',
            },
            draft: true,
            locale: spanishLocale,
            overrideAccess: true,
          })

          const publishedDoc = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(publishedDoc._status!.en).toBe('published')
          expect(publishedDoc.text!.en).toBe('english published 1')
          expect(publishedDoc._status!.es).toBe('published')
          expect(publishedDoc.text!.es).toBe('spanish published 1')

          const latestVersionDoc = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: true,
            locale: 'all',
            overrideAccess: true,
          })

          expect(latestVersionDoc._status!.en).toBe('published')
          expect(latestVersionDoc.text!.en).toBe('english published 1')
          expect(latestVersionDoc._status!.es).toBe('draft')
          expect(latestVersionDoc.text!.es).toBe('spanish draft 2')
        })

        test('should allow querying metadata per locale', async ({ payload }) => {
          const doc = await payload.create({
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'Localized Metadata EN',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })
          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'draft',
              text: 'Localized Metadata ES',
            },
            draft: true,
            locale: spanishLocale,
            overrideAccess: true,
          })

          const esPublished = await payload.find({
            collection: allFieldsLocalizedSlug,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              and: [
                {
                  id: {
                    equals: doc.id,
                  },
                },
                {
                  _status: {
                    equals: 'published',
                  },
                },
              ],
            },
          })
          expect(esPublished.totalDocs).toBe(0)

          const esDraft = await payload.find({
            collection: allFieldsLocalizedSlug,
            draft: true,
            locale: spanishLocale,
            overrideAccess: true,
            where: {
              and: [
                {
                  id: {
                    equals: doc.id,
                  },
                },
                {
                  _status: {
                    equals: 'draft',
                  },
                },
              ],
            },
          })

          expect(esDraft.totalDocs).toBe(1)
          expect(esDraft.docs[0]!.text).toBe('Localized Metadata ES')

          const enPublished = await payload.find({
            collection: allFieldsLocalizedSlug,
            draft: true,
            locale: defaultLocale,
            overrideAccess: true,
            where: {
              and: [
                {
                  id: {
                    equals: doc.id,
                  },
                },
                {
                  _status: {
                    equals: 'published',
                  },
                },
              ],
            },
          })
          expect(enPublished.totalDocs).toBe(1)
          expect(enPublished.docs[0]!.text).toBe('Localized Metadata EN')
        })
      })

      test.describe('on update', () => {
        test('should publish and unpublish single locales', async ({ payload }) => {
          const doc = await payload.create({
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'en published',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })

          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'draft',
              text: 'en draft',
            },
            draft: true,
            locale: defaultLocale,
            overrideAccess: true,
          })

          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'es published',
            },
            locale: spanishLocale,
            overrideAccess: true,
          })

          const mainDocument = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es published')
          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')

          const latestVersion = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: true,
            locale: 'all',
            overrideAccess: true,
          })

          expect(latestVersion._status!.es).toBe('published')
          expect(latestVersion.text!.es).toBe('es published')
          expect(latestVersion._status!.en).toBe('draft')
          expect(latestVersion.text!.en).toBe('en draft')
        })

        test('should publish and unpublish all', async ({ payload }) => {
          const doc = await payload.create({
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'draft',
              text: 'en draft',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })

          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'draft',
              text: 'es draft',
            },
            locale: spanishLocale,
            overrideAccess: true,
          })

          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {
              _status: 'published',
              text: 'en published',
            },
            locale: 'en',
            overrideAccess: true,
            publishAllLocales: true,
          })

          const mainDocument = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')
          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es draft')

          await payload.update({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            data: {},
            overrideAccess: true,
            unpublishAllLocales: true,
          })

          const unpublishedDocument = await payload.findByID({
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(unpublishedDocument._status!.en).toBe('draft')
          expect(unpublishedDocument._status!.es).toBe('draft')
        })
      })
    })

    test.describe('globals', () => {
      test.describe('querying', () => {
        test('should return correct data based on draft arg', async ({ payload }) => {
          // NOTE: passes in MongoDB, fails in PG
          // -> fails to query on version._status.[localeCode] in `replaceWithDraftIfAvailable` when locale = 'all'

          // create english draft 1
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'draft',
              text: 'english draft 1',
            },
            draft: true,
            locale: defaultLocale,
            overrideAccess: true,
          })
          // update english published 1
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'published',
              text: 'english published 1',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })

          // create spanish draft 1
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'draft',
              text: 'spanish draft 1',
            },
            draft: true,
            locale: spanishLocale,
            overrideAccess: true,
          })
          // update spanish published 1
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'published',
              text: 'spanish published 1',
            },
            locale: spanishLocale,
            overrideAccess: true,
          })
          // update spanish draft 2
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'draft',
              text: 'spanish draft 2',
            },
            draft: true,
            locale: spanishLocale,
            overrideAccess: true,
          })

          const publishedDoc = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(publishedDoc._status!.en).toBe('published')
          expect(publishedDoc.text!.en).toBe('english published 1')
          expect(publishedDoc._status!.es).toBe('published')
          expect(publishedDoc.text!.es).toBe('spanish published 1')

          const latestVersionDoc = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            draft: true,
            locale: 'all',
            overrideAccess: true,
          })

          expect(latestVersionDoc._status!.en).toBe('published')
          expect(latestVersionDoc.text!.en).toBe('english published 1')
          expect(latestVersionDoc._status!.es).toBe('draft')
          expect(latestVersionDoc.text!.es).toBe('spanish draft 2')
        })
      })

      test.describe('on update', () => {
        test('should publish and unpublish single locales', async ({ payload }) => {
          const doc = await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'published',
              text: 'en published',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'draft',
              text: 'en draft',
            },
            draft: true,
            locale: defaultLocale,
            overrideAccess: true,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'published',
              text: 'es published',
            },
            locale: spanishLocale,
            overrideAccess: true,
          })

          const mainDocument = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es published')
          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')

          const latestVersion = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            draft: true,
            locale: 'all',
            overrideAccess: true,
          })

          expect(latestVersion._status!.es).toBe('published')
          expect(latestVersion.text!.es).toBe('es published')
          expect(latestVersion._status!.en).toBe('draft')
          expect(latestVersion.text!.en).toBe('en draft')
        })

        test('should publish and unpublish all', async ({ payload }) => {
          const doc = await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'draft',
              text: 'en draft',
            },
            locale: defaultLocale,
            overrideAccess: true,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'draft',
              text: 'es draft',
            },
            locale: spanishLocale,
            overrideAccess: true,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              _status: 'published',
              text: 'en published',
            },
            locale: defaultLocale,
            overrideAccess: true,
            publishAllLocales: true,
          })

          const mainDocument = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')
          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es draft')

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {},
            overrideAccess: true,
            unpublishAllLocales: true,
          })

          const unpublishedDocument = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            draft: false,
            locale: 'all',
            overrideAccess: true,
          })

          expect(unpublishedDocument._status!.en).toBe('draft')
          expect(unpublishedDocument._status!.es).toBe('draft')
        })
      })
    })

    test.describe('fallback behavior', () => {
      let allFieldsPostWithLocalizedData: any

      test.beforeAll(async ({ payloadInstance: payload }) => {
        allFieldsPostWithLocalizedData = await payload.create({
          collection: allFieldsLocalizedSlug,
          data: {
            text: englishTitle,
          },
          locale: englishLocale,
          overrideAccess: true,
        })

        await payload.update({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          data: {
            text: spanishTitle,
          },
          locale: spanishLocale,
          overrideAccess: true,
        })
      })

      test('should fallback to english translation when empty', async ({ payload }) => {
        await payload.update({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          data: {
            text: '',
          },
          locale: spanishLocale,
          overrideAccess: true,
        })

        const localizedFallback: any = await payload.findByID({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(localizedFallback.text.en).toEqual(englishTitle)
        expect(localizedFallback.text.es).toEqual('')

        const retrievedInSpanish = await payload.findByID({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          locale: spanishLocale,
          overrideAccess: true,
        })

        expect(retrievedInSpanish.text).toEqual(englishTitle)
      })

      test('should respect fallback none', async ({ payload }) => {
        const localizedFallback: any = await payload.findByID({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          fallbackLocale: 'none',
          locale: portugueseLocale,
          overrideAccess: true,
        })

        expect(localizedFallback.text).not.toBeDefined()
      })
    })
  })

  test.describe('localized queries', () => {
    test('should count versions with query on localized field', async ({ payload }) => {
      await payload.create({
        collection: localizedDraftsSlug,
        data: {
          title: 'Localized Drafts EN',
        },
        locale: defaultLocale,
        overrideAccess: true,
      })

      const result2 = await payload.countVersions({
        collection: localizedDraftsSlug,
        overrideAccess: true,
        where: {
          'version.title': {
            equals: 'Localized Drafts EN',
          },
        },
      })
      expect(result2.totalDocs).toBe(1)
    })

    test('should count global versions with query on localized field respecting locale', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: globalWithDraftsSlug,
        data: { _status: 'published', text: 'global count en' },
        locale: defaultLocale,
        overrideAccess: true,
      })

      await payload.updateGlobal({
        slug: globalWithDraftsSlug,
        data: { _status: 'published', text: 'global count es' },
        locale: spanishLocale,
        overrideAccess: true,
      })

      const englishWhere = { 'version.text': { equals: 'global count en' } }

      const inEnglish = await payload.countGlobalVersions({
        global: globalWithDraftsSlug,
        locale: defaultLocale,
        overrideAccess: true,
        where: englishWhere,
      })

      const inSpanish = await payload.countGlobalVersions({
        global: globalWithDraftsSlug,
        locale: spanishLocale,
        overrideAccess: true,
        where: englishWhere,
      })

      expect(inEnglish.totalDocs).toBeGreaterThan(0)
      expect(inSpanish.totalDocs).toBe(0)
    })
  })
})

async function createLocalizedPost(
  { payload }: { payload: Payload },
  data: {
    title: {
      [defaultLocale]: string
      [spanishLocale]: string
    }
  },
): Promise<LocalizedPost> {
  const localizedRelation: any = await payload.create({
    collection,
    data: {
      title: data.title.en,
    },
    overrideAccess: true,
  })

  await payload.update({
    id: localizedRelation.id,
    collection,
    data: {
      title: data.title.es,
    },
    locale: spanishLocale,
    overrideAccess: true,
  })

  return localizedRelation
}
