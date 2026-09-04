import type { Payload, User, Where } from 'payload'

import { createLocalReq } from 'payload'
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

test.suite({ config: './config.ts' })('Localization', () => {
  test.describe('Localization with fallback true', () => {
    let post1: LocalizedPost
    let postWithLocalizedData: LocalizedPost

    test.beforeEach(async ({ payload }) => {
      post1 = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
      })

      postWithLocalizedData = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
      })

      await payload.update({
        id: postWithLocalizedData.id,
        collection,
        data: {
          title: spanishTitle,
        },
        locale: spanishLocale,
      })

      await payload.updateGlobal({
        slug: global,
        data: {
          text: spanishTitle,
        },
        locale: spanishLocale,
      })

      await payload.updateGlobal({
        slug: global,
        data: {
          text: englishTitle,
        },
        locale: englishLocale,
      })
    })

    test.describe('Localized text', () => {
      test('create english', async ({ payload }) => {
        const allDocs = await payload.find({
          collection,
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
        })

        expect(updated.title).toEqual(spanishTitle)

        const localized: any = await payload.findByID({
          id: post1.id,
          collection,
          locale: 'all',
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
        })

        const retrievedInSpanish = await payload.findByID({
          id: post1.id,
          collection,
          locale: spanishLocale,
        })

        expect(retrievedInSpanish.title).toEqual(englishTitle)

        const localizedFallback: any = await payload.findByID({
          id: post1.id,
          collection,
          locale: 'all',
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
        })

        const resultAllLocales: any = await payload.findByID({
          id: localizedArrayPost.id,
          collection: arrayCollectionSlug,
          locale: 'all',
        })

        expect(resultAllLocales.items.en[0].text).toEqual('localized array item')
        expect(resultAllLocales.items.es).toEqual(undefined)

        const resultSpanishLocale: any = await payload.findByID({
          id: localizedArrayPost.id,
          collection: arrayCollectionSlug,
          locale: spanishLocale,
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
        })

        expect(localizedFallback.title).toEqual(spanishTitle)
      })

      test('should respect fallback none', async ({ payload }) => {
        const localizedFallback: any = await payload.findByID({
          id: postWithLocalizedData.id,
          collection,
          locale: portugueseLocale,
          fallbackLocale: 'none',
        })

        expect(localizedFallback.title).not.toBeDefined()
      })

      test.describe('fallback locales', () => {
        let englishData
        let spanishData
        let localizedDoc

        test.beforeEach(async ({ payload }) => {
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
          })

          await payload.update({
            id: localizedDoc.id,
            collection: localizedPostsSlug,
            data: spanishData,
            locale: spanishLocale,
          })
          await payload.update({
            id: localizedDoc.id,
            collection: localizedPostsSlug,
            data: { localizedCheckbox: true },
            locale: portugueseLocale,
          })
        })

        test('should return localized fields using fallbackLocale specified in the requested locale config', async ({
          payload,
        }) => {
          const portugueseDoc = await payload.findByID({
            id: localizedDoc.id,
            collection: localizedPostsSlug,
            locale: portugueseLocale,
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
          })

          localizedPost = await payload.update({
            id,
            collection,
            data: {
              title: spanishTitle,
            },
            locale: spanishLocale,
          })
        })

        test('unspecified locale returns default', async ({ payload }) => {
          const localized = await payload.findByID({
            id: localizedPost.id,
            collection,
          })

          expect(localized.title).toEqual(englishTitle)
        })

        test('specific locale - same as default', async ({ payload }) => {
          const localized = await payload.findByID({
            id: localizedPost.id,
            collection,
            locale: defaultLocale,
          })

          expect(localized.title).toEqual(englishTitle)
        })

        test('specific locale - not default', async ({ payload }) => {
          const localized = await payload.findByID({
            id: localizedPost.id,
            collection,
            locale: spanishLocale,
          })

          expect(localized.title).toEqual(spanishTitle)
        })

        test('all locales', async ({ payload }) => {
          const localized: any = await payload.findByID({
            id: localizedPost.id,
            collection,
            locale: 'all',
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
            where: {
              'title.es': {
                equals: spanishTitle,
              },
            },
          })

          expect(result.docs.map(({ id }) => id)).toContain(localizedPost.id)
        })

        test('by localized field value with sorting', async ({ payload }) => {
          const doc_1 = await payload.create({ collection, data: { title: 'word_b' } })
          const doc_2 = await payload.create({ collection, data: { title: 'word_a' } })
          const doc_3 = await payload.create({ collection, data: { title: 'word_c' } })

          await payload.create({ collection, data: { title: 'others_c' } })

          const { docs } = await payload.find({
            collection,
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
                  title: 'non accent post',
                  localizedDescription: 'something',
                },
                locale: englishLocale,
              })

              localizedAccentPostTwo = await payload.create({
                collection,
                data: {
                  title: 'accent post',
                  localizedDescription: 'veterinarian',
                },
                locale: englishLocale,
              })

              await payload.update({
                id: localizedAccentPostOne.id,
                collection,
                data: {
                  title: 'non accent post',
                  localizedDescription: 'valami',
                },
                locale: hungarianLocale,
              })

              await payload.update({
                id: localizedAccentPostTwo.id,
                collection,
                data: {
                  title: 'accent post',
                  localizedDescription: 'állatorvos',
                },
                locale: hungarianLocale,
              })
            })

            test('should sort alphabetically even with accented letters', async ({ payload }) => {
              const sortByDescriptionQuery = await payload.find({
                collection,
                sort: 'description',
                where: {
                  title: {
                    like: 'accent',
                  },
                },
                locale: hungarianLocale,
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
            localizedDate: new Date().toISOString(),
            date: new Date().toISOString(),
          },
        })
        expect(document.localizedDate).toBeTruthy()
      })

      test('data is typed as string', async ({ payload }) => {
        const document = await payload.create({
          collection: localizedDateFieldsSlug,
          data: {
            localizedDate: new Date().toISOString(),
            date: new Date().toISOString(),
          },
        })

        expect(typeof document.localizedDate).toBe('string')
        expect(typeof document.date).toBe('string')
      })
    })

    test.describe('Localized Sort Count', () => {
      const expectedTotalDocs = 5
      const posts: LocalizedSort[] = []
      test.beforeEach(async ({ payload }) => {
        posts.length = 0

        for (let i = 1; i <= expectedTotalDocs; i++) {
          const post = await payload.create({
            collection: localizedSortSlug,
            data: {
              date: new Date().toISOString(),
              title: `EN ${i}`,
            },
            locale: englishLocale,
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
          })
        }
      })

      test('should have correct totalDocs when unsorted', async ({ payload }) => {
        const simpleQuery = await payload.find({
          collection: localizedSortSlug,
        })
        const sortByIdQuery = await payload.find({
          collection: localizedSortSlug,
          sort: 'id',
        })

        expect(simpleQuery.totalDocs).toEqual(expectedTotalDocs)
        expect(sortByIdQuery.totalDocs).toEqual(expectedTotalDocs)
      })

      // https://github.com/payloadcms/payload/issues/4889
      test('should have correct totalDocs when sorted by localized fields', async ({ payload }) => {
        const sortByTitleQuery = await payload.find({
          collection: localizedSortSlug,
          sort: 'title',
        })
        const sortByDateQuery = await payload.find({
          collection: localizedSortSlug,
          sort: 'date',
        })

        expect(sortByTitleQuery.totalDocs).toEqual(expectedTotalDocs)
        expect(sortByDateQuery.totalDocs).toEqual(expectedTotalDocs)
      })

      test('should return correct order when sorted by localized fields', async ({ payload }) => {
        const { docs: docsAsc } = await payload.find({
          collection: localizedSortSlug,
          sort: 'title',
        })
        docsAsc.forEach((doc, i) => {
          expect(posts[i].id).toBe(doc.id)
        })

        const { docs: docsDesc } = await payload.find({
          collection: localizedSortSlug,
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
          const post = await payload.create({ collection: 'localized-sort', data: { title: en } })
          const es = randomWordsSpanish[i]
          await payload.update({
            collection: 'localized-sort',
            data: { title: es },
            id: post.id,
            locale: 'es',
          })

          randomWordsPosts.push(post.id)
        }

        const ascSortedWordsEn = randomWords.toSorted((a, b) => a.localeCompare(b))
        const descSortedWordsEn = randomWords.toSorted((a, b) => b.localeCompare(a))

        const q = { id: { in: randomWordsPosts } }

        const { docs: randomWordsEnAsc } = await payload.find({
          collection: localizedSortSlug,
          sort: 'title',
          where: q,
        })
        randomWordsEnAsc.forEach((doc, i) => {
          expect(ascSortedWordsEn[i]).toBe(doc.title)
        })

        const { docs: randomWordsEnDesc } = await payload.find({
          collection: localizedSortSlug,
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
          sort: 'title',
          where: q,
          locale: 'es',
        })

        randomWordsEsAsc.forEach((doc, i) => {
          expect(ascSortedWordsEs[i]).toBe(doc.title)
        })

        // Fetch sorted words in Spanish (descending)
        const { docs: randomWordsEsDesc } = await payload.find({
          collection: localizedSortSlug,
          sort: '-title',
          where: q,
          locale: 'es',
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

      test.beforeEach(async ({ payload }) => {
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
        })
      })

      test.describe('regular relationship', () => {
        test('can query localized relationship', async ({ payload }) => {
          const result = await payload.find({
            collection: withLocalizedRelSlug,
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
        })

        const reversedArrayRows = [...globalArray.array].reverse()

        const updatedGlobal = await payload.updateGlobal({
          slug: 'global-array',
          data: {
            array: reversedArrayRows,
          },
          locale: 'all',
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
        })

        const updatedDoc = await payload.update({
          id: newDoc.id,
          collection: withRequiredLocalizedFields,
          data: {
            title: 'hello x2',
          },
        })

        expect(updatedDoc.nav.layout[0].blockType).toStrictEqual('text')

        const spanishDoc = await payload.findByID({
          id: newDoc.id,
          collection: withRequiredLocalizedFields,
          locale: spanishLocale,
        })

        expect(spanishDoc.nav.layout[0].blockType).toStrictEqual('number')
      })
    })

    test.describe('Localized - GraphQL', () => {
      let token

      test.beforeEach(async ({ restClient }) => {
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
        })
        const spanishDoc = await payload.create({
          collection: localizedPostsSlug,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
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

      test.beforeEach(async ({ payload }) => {
        const englishDoc = await payload.create({
          collection: arrayCollectionSlug,
          data: {
            items: [
              {
                text: englishTitle,
              },
            ],
          },
        })

        docID = englishDoc.id
      })

      test('should use default locale as fallback', async ({ payload }) => {
        const spanishDoc = await payload.findByID({
          id: docID,
          collection: arrayCollectionSlug,
          locale: spanishLocale,
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
        })

        await payload.update({
          id: englishDoc.id,
          collection: arrayCollectionSlug,
          data: {
            items: [],
          },
          locale: spanishLocale,
        })

        const docWithoutFallback = await payload.findByID({
          id: englishDoc.id,
          collection: arrayCollectionSlug,
          locale: spanishLocale,
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
        })

        const updatedSpanishDoc = await payload.update({
          id: docID,
          collection: arrayCollectionSlug,
          data: {
            items: null,
          },
          locale: spanishLocale,
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
        })

        const docDefaultLocale = await payload.findByID({
          id,
          collection: nestedToArrayAndBlockCollectionSlug,
          locale: defaultLocale,
        })

        const docSpanishLocale = await payload.findByID({
          id,
          collection: nestedToArrayAndBlockCollectionSlug,
          locale: spanishLocale,
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
        })

        const result = await payload.duplicate({
          id,
          collection: localizedPostsSlug,
          locale: defaultLocale,
        })

        const allLocales = await payload.findByID({
          id: result.id,
          collection: localizedPostsSlug,
          locale: 'all',
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
            nav: {
              layout: [
                {
                  blockType: 'text',
                  text: englishText,
                  nestedArray: [
                    {
                      text: 'hello',
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
                    },
                    {
                      text: 'goodbye',
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
                    },
                  ],
                },
              ],
            },
            myTab: {
              text: 'hello',
              group: {
                nestedText: 'hello',
                nestedArray2: [
                  {
                    nestedText: 'hello',
                  },
                  {
                    nestedText: 'goodbye',
                  },
                ],
              },
            },
            title: 'hello',
          },
          locale: defaultLocale,
        })

        await payload.update({
          id: doc.id,
          collection: withRequiredLocalizedFields,
          data: {
            nav: {
              layout: [
                {
                  blockType: 'text',
                  text: spanishText,
                  nestedArray: [
                    {
                      text: 'hola',
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
                    },
                    {
                      text: 'adios',
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
                    },
                  ],
                },
              ],
            },
            title: 'hello',
            myTab: {
              text: 'hola',
              group: {
                nestedText: 'hola',
                nestedArray2: [
                  {
                    nestedText: 'hola',
                  },
                  {
                    nestedText: 'adios',
                  },
                ],
              },
            },
          },
          locale: spanishLocale,
        })

        const result = await payload.duplicate({
          id: doc.id,
          collection: withRequiredLocalizedFields,
          locale: defaultLocale,
        })

        const allLocales = await payload.findByID({
          id: result.id,
          collection: withRequiredLocalizedFields,
          locale: 'all',
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
            title: englishTitle,
            description: 'keep me',
          },
        })

        await payload.update({
          id: post.id,
          collection,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
        })

        const duplicated = await payload.duplicate({
          id: post.id,
          collection,
          selectedLocales: [spanishLocale],
        })

        const allLocales = await payload.findByID({
          id: duplicated.id,
          collection,
          locale: 'all',
        })

        expect(allLocales?.title?.en).toBe(undefined)
        expect(allLocales?.title?.es).toBe(spanishTitle)
        expect(allLocales?.description).toBe('keep me')
      })

      it('should duplicate select locales when a required localized field is unselected', async () => {
        const doc = await payload.create({
          collection: withRequiredLocalizedFields,
          data: {
            nav: {
              layout: [{ blockType: 'text', text: 'english text' }],
            },
            title: 'hello',
          },
          locale: defaultLocale,
        })

        await payload.update({
          id: doc.id,
          collection: withRequiredLocalizedFields,
          data: {
            nav: {
              layout: [{ blockType: 'text', text: 'texto espanol' }],
            },
            title: 'hola',
          },
          locale: spanishLocale,
        })

        const duplicated = await payload.duplicate({
          id: doc.id,
          collection: withRequiredLocalizedFields,
          locale: spanishLocale,
          selectedLocales: [defaultLocale],
        })

        const allLocales: any = await payload.findByID({
          id: duplicated.id,
          collection: withRequiredLocalizedFields,
          locale: 'all',
        })

        expect(allLocales.title.en).toBe('hello')
        expect(allLocales.title.es).toBeUndefined()
        expect(allLocales.nav.layout.en[0].text).toBe('english text')
        expect(allLocales.nav.layout.es ?? null).toBeNull()
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
        })

        expect(result.groupLocalized?.title).toBe('hello en')

        await payload.update({
          collection: groupSlug,
          locale: spanishLocale,
          id: result.id,
          data: {
            groupLocalized: {
              title: 'hello es',
            },
          },
        })

        const docEn = await payload.findByID({
          collection: groupSlug,
          locale: englishLocale,
          id: result.id,
        })
        const docEs = await payload.findByID({
          collection: groupSlug,
          locale: spanishLocale,
          id: result.id,
        })

        expect(docEn.groupLocalized.title).toBe('hello en')
        expect(docEs.groupLocalized.title).toBe('hello es')
      })

      test('should properly create/update/read localized field inside of group', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: groupSlug,
          locale: englishLocale,
          data: {
            group: {
              title: 'hello en',
            },
          },
        })

        expect(result.group.title).toBe('hello en')

        await payload.update({
          collection: groupSlug,
          locale: spanishLocale,
          id: result.id,
          data: {
            group: {
              title: 'hello es',
            },
          },
        })

        const docEn = await payload.findByID({
          collection: groupSlug,
          locale: englishLocale,
          id: result.id,
        })
        const docEs = await payload.findByID({
          collection: groupSlug,
          locale: spanishLocale,
          id: result.id,
        })

        expect(docEn.group.title).toBe('hello en')
        expect(docEs.group.title).toBe('hello es')
      })

      test('should properly create/update/read deep localized field inside of group', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: groupSlug,
          locale: englishLocale,
          data: {
            deep: {
              blocks: [
                {
                  blockType: 'first',
                  title: 'hello en',
                },
              ],
              array: [{ title: 'hello en' }],
            },
          },
        })

        expect(result.deep.array[0].title).toBe('hello en')

        await payload.update({
          collection: groupSlug,
          locale: spanishLocale,
          id: result.id,
          data: {
            deep: {
              blocks: [
                {
                  blockType: 'first',
                  title: 'hello es',
                  id: result.deep.blocks[0].id,
                },
              ],
              array: [
                {
                  id: result.deep.array[0].id,
                  title: 'hello es',
                },
              ],
            },
          },
        })

        const docEn = await payload.findByID({
          collection: groupSlug,
          locale: englishLocale,
          id: result.id,
        })
        const docEs = await payload.findByID({
          collection: groupSlug,
          locale: spanishLocale,
          id: result.id,
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
        })

        expect(doc.groupLocalizedRow.text).toBe('hello world')

        const docES = await payload.update({
          collection: 'groups',
          data: {
            groupLocalizedRow: {
              text: 'hola world or something',
            },
          },
          locale: 'es',
          id: doc.id,
        })

        expect(docES.groupLocalizedRow.text).toBe('hola world or something')

        // check if docES didnt break EN
        const docEN = await payload.findByID({ collection: 'groups', id: doc.id, locale: 'en' })
        expect(docEN.groupLocalizedRow.text).toBe('hello world')

        const all = await payload.findByID({ collection: 'groups', id: doc.id, locale: 'all' })

        expect(all.groupLocalizedRow.en.text).toBe('hello world')
        expect(all.groupLocalizedRow.es.text).toBe('hola world or something')
      })

      test('should not crash on empty localized tab', async ({ payload }) => {
        const result = await payload.create({
          collection: tabSlug,
          locale: englishLocale,
          data: {
            tabLocalized: {},
          },
        })

        expect(result).toBeTruthy()
      })

      test('should properly create/update/read array field inside localized tab field', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: tabSlug,
          locale: englishLocale,
          data: {
            tabLocalized: {
              title: 'hello en',
            },
          },
        })

        expect(result.tabLocalized?.title).toBe('hello en')

        await payload.update({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
          data: {
            tabLocalized: {
              title: 'hello es',
            },
          },
        })

        const docEn = await payload.findByID({
          collection: tabSlug,
          locale: englishLocale,
          id: result.id,
        })

        const docEs = await payload.findByID({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
        })

        expect(docEn.tabLocalized.title).toBe('hello en')
        expect(docEs.tabLocalized.title).toBe('hello es')
      })

      test('should properly create/update/read localized tab field', async ({ payload }) => {
        const result = await payload.create({
          collection: tabSlug,
          locale: englishLocale,
          data: {
            tabLocalized: {
              array: [
                {
                  title: 'hello en',
                },
              ],
            },
          },
        })

        expect(result.tabLocalized.array[0].title).toBe('hello en')

        await payload.update({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
          data: {
            tabLocalized: {
              array: [{ title: 'hello es' }],
            },
          },
        })

        const docEn = await payload.findByID({
          collection: tabSlug,
          locale: englishLocale,
          id: result.id,
        })

        const docEs = await payload.findByID({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
        })

        expect(docEn.tabLocalized.array[0].title).toBe('hello en')
        expect(docEs.tabLocalized.array[0].title).toBe('hello es')
      })

      test('should properly create/update/read localized field inside of tab', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: tabSlug,
          locale: englishLocale,
          data: {
            tab: {
              title: 'hello en',
            },
          },
        })

        expect(result.tab.title).toBe('hello en')

        await payload.update({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
          data: {
            tab: {
              title: 'hello es',
            },
          },
        })

        const docEn = await payload.findByID({
          collection: tabSlug,
          locale: englishLocale,
          id: result.id,
        })
        const docEs = await payload.findByID({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
        })

        expect(docEn.tab.title).toBe('hello en')
        expect(docEs.tab.title).toBe('hello es')
      })

      test('should properly create/update/read deep localized field inside of tab', async ({
        payload,
      }) => {
        const result = await payload.create({
          collection: tabSlug,
          locale: englishLocale,
          data: {
            deep: {
              blocks: [
                {
                  blockType: 'first',
                  title: 'hello en',
                },
              ],
              array: [{ title: 'hello en' }],
            },
          },
        })

        expect(result.deep.array[0].title).toBe('hello en')

        await payload.update({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
          data: {
            deep: {
              blocks: [
                {
                  blockType: 'first',
                  title: 'hello es',
                  id: result.deep.blocks[0].id,
                },
              ],
              array: [
                {
                  id: result.deep.array[0].id,
                  title: 'hello es',
                },
              ],
            },
          },
        })

        const docEn = await payload.findByID({
          collection: tabSlug,
          locale: englishLocale,
          id: result.id,
        })
        const docEs = await payload.findByID({
          collection: tabSlug,
          locale: spanishLocale,
          id: result.id,
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
          locale: spanishLocale,
          data: {
            tabLocalized: {
              group: {
                heading: 'Spanish heading',
              },
            },
          },
        })

        await payload.update({
          collection: tabSlug,
          locale: englishLocale,
          id: docEs.id,
          data: {
            tabLocalized: {
              group: {
                heading: 'English heading',
              },
            },
          },
        })

        const readEn = await payload.findByID({
          collection: tabSlug,
          locale: englishLocale,
          id: docEs.id,
        })

        const readEs = await payload.findByID({
          collection: tabSlug,
          locale: spanishLocale,
          id: docEs.id,
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
                blockType: 'blockInsideBlock',
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
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'hello',
                  },
                ],
              },
            ],
          },
        })

        id = doc.id

        const retrievedInEN = await payload.findByID({
          collection: 'blocks-fields',
          id,
        })

        await payload.update({
          collection: 'blocks-fields',
          id,
          locale: 'es',
          data: {
            content: [
              {
                blockType: 'blockInsideBlock',
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
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'hola',
                  },
                ],
              },
            ],
          },
        })

        const retrieved = await payload.findByID({
          collection: 'blocks-fields',
          id,
          locale: 'all',
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
          })
        ).docs[0]

        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
          })
        ).docs[1]

        const blocksWithinArrayEN = [
          {
            blockName: '1',
            blockType: 'someBlock',
            relationWithinBlock: randomDoc.id,
            myGroup: {
              text: 'hello in english 1',
            },
          },
          {
            blockName: '2',
            blockType: 'someBlock',
            relationWithinBlock: randomDoc.id,
            myGroup: {
              text: 'hello in english 2',
            },
          },
          {
            blockName: '3',
            blockType: 'someBlock',
            relationWithinBlock: randomDoc.id,
            myGroup: {
              text: 'hello in english 3',
            },
          },
        ]

        const blocksWithinArrayES = [
          {
            blockName: '1',
            blockType: 'someBlock',
            relationWithinBlock: randomDoc2.id,
            myGroup: {
              text: 'hello in spanish 1',
            },
          },
          {
            blockName: '2',
            blockType: 'someBlock',
            relationWithinBlock: randomDoc2.id,
            myGroup: {
              text: 'hello in spanish 2',
            },
          },
          {
            blockName: '3',
            blockType: 'someBlock',
            relationWithinBlock: randomDoc2.id,
            myGroup: {
              text: 'hello in spanish 3',
            },
          },
        ]

        const createdEnDoc = await payload.create({
          collection: 'nested-arrays',
          locale: 'en',
          depth: 0,
          data: {
            arrayWithBlocks: [
              {
                blocksWithinArray: blocksWithinArrayEN as any,
              },
            ],
          },
        })

        const updatedEsDoc = await payload.update({
          collection: 'nested-arrays',
          id: createdEnDoc.id,
          depth: 0,
          locale: 'es',
          data: {
            arrayWithBlocks: [
              {
                blocksWithinArray: blocksWithinArrayES as any,
              },
            ],
          },
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
          locale: 'en',
          depth: 0,
        })
        removeId(enDoc2.arrayWithBlocks[0].blocksWithinArray)
        expect(enDoc2.arrayWithBlocks[0].blocksWithinArray).toEqual(blocksWithinArrayEN)
      })

      test('should update localized relation within unLocalized array', async ({ payload }) => {
        const randomTextDoc = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
          })
        ).docs[0]
        const randomTextDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
          })
        ).docs[1]

        const createdEnDoc = await payload.create({
          collection: 'nested-arrays',
          locale: 'en',
          depth: 0,
          data: {
            arrayWithLocalizedRelation: [
              {
                localizedRelation: randomTextDoc.id,
              },
            ],
          },
        })

        const updatedEsDoc = await payload.update({
          collection: 'nested-arrays',
          id: createdEnDoc.id,
          depth: 0,
          locale: 'es',
          data: {
            arrayWithLocalizedRelation: [
              {
                id: createdEnDoc.arrayWithLocalizedRelation[0].id,
                localizedRelation: randomTextDoc2.id,
              },
            ],
          },
        })

        expect(updatedEsDoc.arrayWithLocalizedRelation).toHaveLength(1)
        expect(updatedEsDoc.arrayWithLocalizedRelation[0].localizedRelation).toBe(randomTextDoc2.id)

        expect(createdEnDoc.arrayWithLocalizedRelation).toHaveLength(1)
        expect(createdEnDoc.arrayWithLocalizedRelation[0].localizedRelation).toBe(randomTextDoc.id)

        // pull enDoc again and make sure the update of esDoc did not mess with the data of enDoc
        const enDoc2 = await payload.findByID({
          id: createdEnDoc.id,
          collection: 'nested-arrays',
          locale: 'en',
          depth: 0,
        })
        expect(enDoc2.arrayWithLocalizedRelation).toHaveLength(1)
        expect(enDoc2.arrayWithLocalizedRelation[0].localizedRelation).toBe(randomTextDoc.id)
      })
    })

    test.describe('nested fields', () => {
      test('should update localized block', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'blocks-fields',
          locale: 'en',
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
                blockName: null,
                array: [],
                blockType: 'blockInsideBlock',
                content: [
                  {
                    // Same as above.
                    // id: doc.content?.[0]?.content?.[0]?.id,
                    text: 'some-text',
                    blockName: null,
                    blockType: 'textBlock',
                  },
                ],
              },
            ],
          },
          locale: 'es',
        })

        console.dir(updated, { depth: null })

        expect(updated.content?.[0]?.content?.[0]?.text).toBe('some-text')
      })

      test('update specific locale should not erease the others in blocks and arrays', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: 'nested',
          locale: 'en',
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
        })

        expect(doc.blocks?.[0]?.someText).toBe('some-block-text-en')
        expect(doc.topLevelArray?.[0]?.localizedText).toBe('some-localized-text')
        expect(doc.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text')
        expect(doc.topLevelArray).toHaveLength(1)

        const findAllLocales = await payload.findByID({
          id: doc.id,
          collection: 'nested',
          locale: 'all',
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
          locale: 'es',
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
        })

        expect(updatedDoc.blocks?.[0]?.someText).toBe('some-block-text-es')
        expect(updatedDoc.topLevelArray?.[0]?.localizedText).toBe('some-localized-text-es')
        expect(updatedDoc.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text-es')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'nested',
          locale: 'all',
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
          locale: 'en',
          data: {
            title: 'some-localized-title',
            description: 'some-not-localized-description',
            localizedDescription: 'some-localized-description',
          },
        })

        expect(doc.title).toBe('some-localized-title')
        expect(doc.localizedDescription).toBe('some-localized-description')

        const findAllLocales = await payload.findByID({
          id: doc.id,
          collection: 'localized-posts',
          locale: 'all',
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
          locale: 'es',
          data: {
            title: 'some-localized-title-es',
            description: 'some-not-localized-description-es',
            localizedDescription: 'some-localized-description-es',
          },
        })

        expect(updatedDoc.title).toBe('some-localized-title-es')
        expect(updatedDoc.localizedDescription).toBe('some-localized-description-es')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'localized-posts',
          locale: 'all',
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
          })
        ).docs[0]
        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
          })
        ).docs[1]

        const newDoc = await payload.create({
          collection: 'nested-field-tables',
          data: {
            array: [
              {
                relation: {
                  value: randomDoc.id,
                  relationTo: 'localized-posts',
                },
                hasManyRelation: [randomDoc.id, randomDoc2.id],
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
                number: [1, 2],
                text: ['hello', 'goodbye'],
                select: ['one'],
              },
            ],
          },
        })

        await payload.update({
          collection: 'nested-field-tables',
          id: newDoc.id,
          locale: 'es',
          data: {
            array: [
              {
                relation: {
                  value: randomDoc2.id,
                  relationTo: 'localized-posts',
                },
                hasManyRelation: [randomDoc2.id, randomDoc.id],
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
                select: ['two', 'three'],
                text: ['hola', 'adios'],
                number: [3, 4],
              },
            ],
          },
        })

        const retrieved = await payload.findByID({
          collection: 'nested-field-tables',
          id: newDoc.id,
          depth: 0,
          locale: 'all',
        })

        expect(retrieved.array.en[0].relation.value).toStrictEqual(randomDoc.id)
        expect(retrieved.array.es[0].relation.value).toStrictEqual(randomDoc2.id)

        expect(retrieved.array.en[0].hasManyRelation).toEqual([randomDoc.id, randomDoc2.id])
        expect(retrieved.array.es[0].hasManyRelation).toEqual([randomDoc2.id, randomDoc.id])

        expect(retrieved.array.en[0].hasManyPolyRelation).toEqual([
          { value: randomDoc.id, relationTo: 'localized-posts' },
          { value: randomDoc2.id, relationTo: 'localized-posts' },
        ])
        expect(retrieved.array.es[0].hasManyPolyRelation).toEqual([
          { value: randomDoc2.id, relationTo: 'localized-posts' },
          { value: randomDoc.id, relationTo: 'localized-posts' },
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
          })
        ).docs[0]
        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
          })
        ).docs[1]

        const docEn = await payload.create({
          collection: 'nested-field-tables',
          depth: 0,
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
        })

        expect(docEn.blocks[0].nestedBlocks[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[1].nestedBlocks[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[2].nestedBlocks[0].relation.value).toBe(randomDoc.id)

        const docEs = await payload.update({
          id: docEn.id,
          depth: 0,
          locale: 'es',
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
        })

        expect(docEs.blocks[0].nestedBlocks[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[1].nestedBlocks[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[2].nestedBlocks[0].relation.value).toBe(randomDoc2.id)

        const docAll = await payload.findByID({
          collection: 'nested-field-tables',
          id: docEn.id,
          locale: 'all',
          depth: 0,
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
          })
        ).docs[0]
        const randomDoc2 = (
          await payload.find({
            collection: 'localized-posts',
            depth: 0,
          })
        ).docs[1]

        const docEn = await payload.create({
          collection: 'nested-field-tables',
          depth: 0,
          data: {
            blocks: [
              {
                blockType: 'block',
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc.id,
                    },
                  },
                ],
              },
            ],
          },
        })

        expect(docEn.blocks[0].array[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[1].array[0].relation.value).toBe(randomDoc.id)
        expect(docEn.blocks[2].array[0].relation.value).toBe(randomDoc.id)

        const docEs = await payload.update({
          id: docEn.id,
          depth: 0,
          locale: 'es',
          collection: 'nested-field-tables',
          data: {
            blocks: [
              {
                blockType: 'block',
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
              },
              {
                blockType: 'block',
                array: [
                  {
                    relation: {
                      relationTo: 'localized-posts',
                      value: randomDoc2.id,
                    },
                  },
                ],
              },
            ],
          },
        })

        expect(docEs.blocks[0].array[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[1].array[0].relation.value).toBe(randomDoc2.id)
        expect(docEs.blocks[2].array[0].relation.value).toBe(randomDoc2.id)

        const docAll = await payload.findByID({
          collection: 'nested-field-tables',
          id: docEn.id,
          locale: 'all',
          depth: 0,
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
          locale: 'ar',
          data: {
            unique: 'text',
          },
        })

        await payload.create({
          collection: 'localized-posts',
          locale: 'en',
          data: {
            unique: 'text',
          },
        })

        await payload.create({
          collection: 'localized-posts',
          locale: 'es',
          data: {
            unique: 'text',
          },
        })

        await expect(
          payload.create({
            collection: 'localized-posts',
            locale: 'en',
            data: {
              unique: 'text',
            },
          }),
        ).rejects.toBeTruthy()
      })

      test('should return correct error path without locale suffix for top-level localized unique field', async ({
        payload,
      }) => {
        const uniqueValue = `unique-path-test-${Date.now()}`

        await payload.create({
          collection: localizedPostsSlug,
          locale: 'en',
          data: {
            unique: uniqueValue,
          },
        })

        try {
          await payload.create({
            collection: localizedPostsSlug,
            locale: 'en',
            data: {
              unique: uniqueValue,
            },
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
          locale: 'en',
          data: {
            title: 'Test title 1',
            seoTitle: uniqueValue,
            nav: {
              layout: blockData,
            },
          },
        })

        try {
          await payload.create({
            collection: withRequiredLocalizedFields,
            locale: 'en',
            data: {
              title: 'Test title 2',
              seoTitle: uniqueValue,
              nav: {
                layout: blockData,
              },
            },
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

      test.beforeEach(async ({ payload }) => {
        user = (
          await payload.find({
            collection: 'users',
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
            title: 'Hello',
            group: {
              children: 'Children',
            },
            unique: 'unique-field',
            localizedCheckbox: true,
          },
        })

        const req = await createLocalReq({ user }, payload)

        const res = (await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'es',
          docID: doc.id,
          collectionSlug: 'localized-posts',
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
          locale: 'en',
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
        })

        const req = await createLocalReq({ user }, payload)

        const res = (await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'es',
          docID: doc.id,
          collectionSlug: 'blocks-fields',
        })) as BlocksField

        expect(res.content?.[0]?.content?.[0]?.text).toBe('some-text')
      })

      test('should copy block inside tab to locale', async ({ payload }) => {
        // This was previously an e2e test but it was migrated to int
        // because at the moment only int tests run in Postgres in CI,
        // and that's where the bug occurs.
        const doc = await payload.create({
          collection: 'blocks-fields',
          locale: 'en',
          data: {
            tabContent: [
              {
                blockType: 'blockInsideTab',
                text: 'some-text',
              },
            ],
          },
        })

        const req = await createLocalReq({ user }, payload)
        const res = (await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'pt',
          docID: doc.id,
          collectionSlug: 'blocks-fields',
        })) as BlocksField

        expect(res.tabContent?.[0]?.text).toBe('some-text')
      })

      test('should copy localized nested to arrays', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'nested',
          locale: 'en',
          data: {
            topLevelArray: [
              {
                localizedText: 'some-localized-text',
                notLocalizedText: 'some-not-localized-text',
              },
            ],
          },
        })

        const req = await createLocalReq({ user }, payload)

        const res = (await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'es',
          docID: doc.id,
          collectionSlug: 'nested',
        })) as Nested

        expect(res.topLevelArray?.[0]?.localizedText).toBe('some-localized-text')
        expect(res.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'nested',
        })

        // The source data should remain unchanged
        expect(refreshedDoc.topLevelArray?.[0]?.localizedText).toBe('some-localized-text')
        expect(refreshedDoc.topLevelArray?.[0]?.notLocalizedText).toBe('some-not-localized-text')
        expect(refreshedDoc.topLevelArray).toHaveLength(1)
      })

      test('should copy localized arrays', async ({ payload }) => {
        const doc = await payload.create({
          collection: 'nested',
          locale: 'en',
          data: {
            topLevelArrayLocalized: [
              {
                text: 'some-text',
              },
            ],
          },
        })

        const req = await createLocalReq({ user }, payload)

        const res = (await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'es',
          docID: doc.id,
          collectionSlug: 'nested',
        })) as Nested

        expect(res.topLevelArrayLocalized?.[0]?.text).toBe('some-text')

        const refreshedDoc = await payload.findByID({
          id: doc.id,
          collection: 'nested',
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
        })

        try {
          const req = await createLocalReq({ user }, payload)

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
          locale: 'en',
          data: {
            title: 'English Title',
            content: [
              {
                blockType: 'blockInsideBlock',
                text: 'English block text',
                content: [
                  {
                    blockType: 'textBlock',
                    text: 'Nested English text',
                  },
                ],
              },
            ],
          },
        })

        // Add content to Spanish locale separately
        await payload.update({
          collection: 'blocks-fields',
          id: doc.id,
          locale: 'es',
          data: {
            title: 'Spanish Title',
            content: [
              {
                blockType: 'blockInsideBlock',
                text: 'Spanish block text',
              },
            ],
          },
        })

        // Verify initial state - English data should exist
        const enDocBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
        })

        expect(enDocBefore.title).toBe('English Title')
        expect(enDocBefore.content?.[0]?.text).toBe('English block text')

        // Copy data from en to es
        const req = await createLocalReq({ user }, payload)

        await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'es',
          docID: doc.id,
          collectionSlug: 'blocks-fields',
          overrideData: true,
        })

        // CRITICAL: Verify English data is NOT lost after copy operation
        const enDocAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
        })

        expect(enDocAfter.title).toBe('English Title')
        expect(enDocAfter.content?.[0]?.text).toBe('English block text')
        expect(enDocAfter.content?.[0]?.content?.[0]?.text).toBe('Nested English text')

        // Verify Spanish locale received the copied data (as a draft)
        const esDocAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'es',
          draft: true,
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
          locale: 'en',
          draft: true,
          data: {
            title: 'Draft English Title',
            content: [
              {
                blockType: 'blockInsideBlock',
                text: 'Draft block text',
              },
            ],
          },
        })

        // Verify draft exists
        const draftBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
          draft: true,
        })

        expect(draftBefore.title).toBe('Draft English Title')

        // Copy draft data to another locale
        const req = await createLocalReq({ user }, payload)

        await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'es',
          docID: doc.id,
          collectionSlug: 'blocks-fields',
        })

        // Verify the source draft is not lost
        const draftAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
          draft: true,
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
          locale: 'en',
          data: {
            title: 'Published EN',
          },
        })

        // Create draft with different content
        await payload.update({
          collection: 'blocks-fields',
          id: doc.id,
          locale: 'en',
          draft: true,
          data: {
            title: 'Draft EN',
          },
        })

        // Verify both published and draft exist with different content
        const enPublishedBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
          draft: false,
        })
        const enDraftBefore = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
          draft: true,
        })

        expect(enPublishedBefore.title).toBe('Published EN')
        expect(enDraftBefore.title).toBe('Draft EN')

        // Copy to another locale using the actual handler
        const req = await createLocalReq({ user }, payload)

        await copyDataFromLocaleHandler({
          fromLocale: 'en',
          req,
          toLocale: 'es',
          docID: doc.id,
          collectionSlug: 'blocks-fields',
          overrideData: true,
        })

        // Verify published content in source locale is NOT overwritten
        const enPublishedAfter = await payload.findByID({
          id: doc.id,
          collection: 'blocks-fields',
          locale: 'en',
          draft: false,
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
              locale: portugueseLocale,
              fallbackLocale: [spanishLocale, englishLocale],
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
              locale: portugueseLocale,
              fallbackLocale: ['hu', 'ar', spanishLocale],
            })

            expect(result).toBeDefined()
            expect((result as any).title).toBe(spanishTitle)
          })

          test('should return undefined if no fallback locales exist', async ({ payload }) => {
            const result = await payload.findByID({
              id: postWithLocalizedData.id,
              collection,
              locale: portugueseLocale,
              fallbackLocale: ['hu', 'ar'],
            })

            expect(result).toBeDefined()
            expect((result as any).title).not.toBeDefined()
          })
        })

        test.describe('Globals', () => {
          test('should allow fallback locale to be an array', async ({ payload }) => {
            const result = await payload.findGlobal({
              slug: global,
              locale: portugueseLocale,
              fallbackLocale: [spanishLocale, englishLocale],
            })

            expect(result).toBeDefined()
            expect(result.text).toBe(spanishTitle)
          })

          test('should pass over fallback locales until it finds one that exists', async ({
            payload,
          }) => {
            const result = await payload.findGlobal({
              slug: global,
              locale: portugueseLocale,
              fallbackLocale: ['hu', spanishLocale],
            })
            expect(result).toBeDefined()
            expect(result.text).toBe(spanishTitle)
          })

          test('should return undefined if no fallback locales exist', async ({ payload }) => {
            const result = await payload.findGlobal({
              slug: global,
              locale: portugueseLocale,
              fallbackLocale: ['hu', 'ar'],
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
                query: { locale: 'pt', fallbackLocale: ['es', 'en'] },
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
                query: { locale: 'pt', fallbackLocale: ['hu', 'ar', 'es'] },
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
                query: { locale: 'pt', fallbackLocale: ['hu', 'ar'] },
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
                query: { locale: 'pt', fallbackLocale: ['es', 'en'] },
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
                query: { locale: 'pt', fallbackLocale: ['hu', 'ar', 'es'] },
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
                query: { locale: 'pt', fallbackLocale: ['hu', 'ar'] },
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

    test.beforeEach(async ({ payload }) => {
      if (payload.config.localization) {
        payload.config.localization.fallback = false
      }

      post1 = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
      })

      postWithLocalizedData = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
      })

      await payload.update({
        id: postWithLocalizedData.id,
        collection,
        data: {
          title: spanishTitle,
        },
        locale: spanishLocale,
      })
    })

    test.describe('fallback locale', () => {
      test('create english', async ({ payload }) => {
        const allDocs = await payload.find({
          collection,
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
        })

        expect(updated.title).toEqual(spanishTitle)

        const localized: any = await payload.findByID({
          id: post1.id,
          collection,
          locale: 'all',
        })

        expect(localized.title.en).toEqual(englishTitle)
        expect(localized.title.es).toEqual(spanishTitle)
      })

      test('should not fallback to english', async ({ payload }) => {
        const retrievedDoc = await payload.findByID({
          id: post1.id,
          collection,
          locale: portugueseLocale,
        })

        expect(retrievedDoc.title).not.toBeDefined()
      })

      test('should fallback to english with explicit fallbackLocale', async ({ payload }) => {
        const fallbackDoc = await payload.findByID({
          id: post1.id,
          collection,
          locale: portugueseLocale,
          fallbackLocale: englishLocale,
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
        })

        expect(localizedFallback.title).not.toBeDefined()
      })

      test('should respect fallback none', async ({ payload }) => {
        const localizedFallback: any = await payload.findByID({
          id: postWithLocalizedData.id,
          collection,
          locale: portugueseLocale,
          fallbackLocale: false,
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
        })

        await payload.update({
          collection: allFieldsLocalizedSlug,
          id: originalPost.id,
          data: {
            selfRelation: originalPost.id,
          },
          locale: 'en',
        })

        const spanishPostWithEnglishFallback = await payload.findByID({
          collection: allFieldsLocalizedSlug,
          id: originalPost.id,
          locale: 'es',
          fallbackLocale: 'en',
        })

        expect(spanishPostWithEnglishFallback.text).toBe('Post EN')

        const spanishPostWithNoFallback = await payload.findByID({
          collection: allFieldsLocalizedSlug,
          id: originalPost.id,
          locale: 'es',
          fallbackLocale: false,
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
          t1: {
            t2: {
              text: 'EN Deep Text',
            },
          },
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
          text: 'English text',
          _status: 'draft',
        },
        locale: 'en',
      })

      const allLocalesDoc = await payload.findByID({
        collection: allFieldsLocalizedSlug,
        id: doc.id,
        locale: 'all',
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
          text: 'title',
          group: {
            en: {
              text: 'some text',
            },
          },
        },
      })

      const queriedDoc = await payload.find({
        collection: noLocalizedFieldsCollectionSlug,
        where: {
          'group.en.text': { equals: 'some text' },
        },
      })

      expect(queriedDoc.docs).toHaveLength(1)
      expect(queriedDoc.docs[0]!.id).toBe(doc.id)
    })
  })

  test.describe('localize status', () => {
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
              text: 'Localized Metadata EN',
              _status: 'published',
            },
            locale: defaultLocale,
          })

          const esDoc = await payload.findByID({
            locale: spanishLocale,
            id: doc.id,
            collection: allFieldsLocalizedSlug,
          })

          expect(esDoc._status).toContain('draft')
        })

        test('should allow publishing of all locales upon creation', async ({ payload }) => {
          const doc = await payload.create({
            collection: allFieldsLocalizedSlug,
            data: {
              text: 'Localized Metadata EN',
              _status: 'published',
            },
            locale: defaultLocale,
            publishAllLocales: true,
          })

          const esDoc = await payload.findByID({
            locale: spanishLocale,
            id: doc.id,
            collection: allFieldsLocalizedSlug,
          })

          expect(esDoc._status).toContain('published')
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
              text: 'english draft 1',
              _status: 'draft',
            },
            draft: true,
            locale: defaultLocale,
          })
          // update english published 1
          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'english published 1',
              _status: 'published',
            },
            locale: defaultLocale,
          })

          // create spanish draft 1
          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'spanish draft 1',
              _status: 'draft',
            },
            draft: true,
            locale: spanishLocale,
          })
          // update spanish published 1
          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'spanish published 1',
              _status: 'published',
            },
            locale: spanishLocale,
          })
          // update spanish draft 2
          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'spanish draft 2',
              _status: 'draft',
            },
            draft: true,
            locale: spanishLocale,
          })

          const publishedDoc = await payload.findByID({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            locale: 'all',
            draft: false,
          })

          expect(publishedDoc._status!.en).toBe('published')
          expect(publishedDoc.text!.en).toBe('english published 1')
          expect(publishedDoc._status!.es).toBe('published')
          expect(publishedDoc.text!.es).toBe('spanish published 1')

          const latestVersionDoc = await payload.findByID({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            draft: true,
            locale: 'all',
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
              text: 'Localized Metadata EN',
              _status: 'published',
            },
            locale: defaultLocale,
          })
          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'Localized Metadata ES',
              _status: 'draft',
            },
            draft: true,
            locale: spanishLocale,
          })

          const esPublished = await payload.find({
            locale: spanishLocale,
            collection: allFieldsLocalizedSlug,
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
            locale: spanishLocale,
            collection: allFieldsLocalizedSlug,
            draft: true,
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
            locale: defaultLocale,
            collection: allFieldsLocalizedSlug,
            draft: true,
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
              text: 'en published',
              _status: 'published',
            },
            locale: defaultLocale,
          })

          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'en draft',
              _status: 'draft',
            },
            draft: true,
            locale: defaultLocale,
          })

          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'es published',
              _status: 'published',
            },
            locale: spanishLocale,
          })

          const mainDocument = await payload.findByID({
            locale: 'all',
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: false,
          })

          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es published')
          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')

          const latestVersion = await payload.findByID({
            locale: 'all',
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: true,
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
              text: 'en draft',
              _status: 'draft',
            },
            locale: defaultLocale,
          })

          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'es draft',
              _status: 'draft',
            },
            locale: spanishLocale,
          })

          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            data: {
              text: 'en published',
              _status: 'published',
            },
            locale: 'en',
            publishAllLocales: true,
          })

          const mainDocument = await payload.findByID({
            locale: 'all',
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: false,
          })

          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')
          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es draft')

          await payload.update({
            collection: allFieldsLocalizedSlug,
            id: doc.id,
            unpublishAllLocales: true,
            data: {},
          })

          const unpublishedDocument = await payload.findByID({
            locale: 'all',
            id: doc.id,
            collection: allFieldsLocalizedSlug,
            draft: false,
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
              text: 'english draft 1',
              _status: 'draft',
            },
            draft: true,
            locale: defaultLocale,
          })
          // update english published 1
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'english published 1',
              _status: 'published',
            },
            locale: defaultLocale,
          })

          // create spanish draft 1
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'spanish draft 1',
              _status: 'draft',
            },
            draft: true,
            locale: spanishLocale,
          })
          // update spanish published 1
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'spanish published 1',
              _status: 'published',
            },
            locale: spanishLocale,
          })
          // update spanish draft 2
          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'spanish draft 2',
              _status: 'draft',
            },
            draft: true,
            locale: spanishLocale,
          })

          const publishedDoc = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            locale: 'all',
            draft: false,
          })

          expect(publishedDoc._status!.en).toBe('published')
          expect(publishedDoc.text!.en).toBe('english published 1')
          expect(publishedDoc._status!.es).toBe('published')
          expect(publishedDoc.text!.es).toBe('spanish published 1')

          const latestVersionDoc = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            draft: true,
            locale: 'all',
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
              text: 'en published',
              _status: 'published',
            },
            locale: defaultLocale,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'en draft',
              _status: 'draft',
            },
            draft: true,
            locale: defaultLocale,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'es published',
              _status: 'published',
            },
            locale: spanishLocale,
          })

          const mainDocument = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            locale: 'all',
            draft: false,
          })

          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es published')
          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')

          const latestVersion = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            locale: 'all',
            draft: true,
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
              text: 'en draft',
              _status: 'draft',
            },
            locale: defaultLocale,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'es draft',
              _status: 'draft',
            },
            locale: spanishLocale,
          })

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            data: {
              text: 'en published',
              _status: 'published',
            },
            locale: defaultLocale,
            publishAllLocales: true,
          })

          const mainDocument = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            locale: 'all',
            draft: false,
          })

          expect(mainDocument._status!.en).toBe('published')
          expect(mainDocument.text!.en).toBe('en published')
          expect(mainDocument._status!.es).toBe('published')
          expect(mainDocument.text!.es).toBe('es draft')

          await payload.updateGlobal({
            slug: globalWithDraftsSlug,
            unpublishAllLocales: true,
            data: {},
          })

          const unpublishedDocument = await payload.findGlobal({
            slug: globalWithDraftsSlug,
            locale: 'all',
            draft: false,
          })

          expect(unpublishedDocument._status!.en).toBe('draft')
          expect(unpublishedDocument._status!.es).toBe('draft')
        })
      })
    })

    test.describe('fallback behavior', () => {
      let allFieldsPostWithLocalizedData: any

      test.beforeEach(async ({ payload }) => {
        allFieldsPostWithLocalizedData = await payload.create({
          collection: allFieldsLocalizedSlug,
          data: {
            text: englishTitle,
          },
          locale: englishLocale,
        })

        await payload.update({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          data: {
            text: spanishTitle,
          },
          locale: spanishLocale,
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
        })

        const localizedFallback: any = await payload.findByID({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          locale: 'all',
        })

        expect(localizedFallback.text.en).toEqual(englishTitle)
        expect(localizedFallback.text.es).toEqual('')

        const retrievedInSpanish = await payload.findByID({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          locale: spanishLocale,
        })

        expect(retrievedInSpanish.text).toEqual(englishTitle)
      })

      test('should respect fallback none', async ({ payload }) => {
        const localizedFallback: any = await payload.findByID({
          id: allFieldsPostWithLocalizedData.id,
          collection: allFieldsLocalizedSlug,
          locale: portugueseLocale,
          fallbackLocale: 'none',
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
      })

      const result2 = await payload.countVersions({
        collection: localizedDraftsSlug,
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
        data: { text: 'global count en', _status: 'published' },
        locale: defaultLocale,
      })

      await payload.updateGlobal({
        slug: globalWithDraftsSlug,
        data: { text: 'global count es', _status: 'published' },
        locale: spanishLocale,
      })

      const englishWhere = { 'version.text': { equals: 'global count en' } }

      const inEnglish = await payload.countGlobalVersions({
        global: globalWithDraftsSlug,
        locale: defaultLocale,
        where: englishWhere,
      })

      const inSpanish = await payload.countGlobalVersions({
        global: globalWithDraftsSlug,
        locale: spanishLocale,
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
  })

  await payload.update({
    id: localizedRelation.id,
    collection,
    data: {
      title: data.title.es,
    },
    locale: spanishLocale,
  })

  return localizedRelation
}
