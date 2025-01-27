import { GraphQLClient } from 'graphql-request'

import type { Config } from '../../packages/payload/src/config/types'
import type { Where } from '../../packages/payload/src/types'
import type { LocalizedPost, LocalizedSort, WithLocalizedRelationship } from './payload-types'

import payload from '../../packages/payload/src'
import { devUser } from '../credentials'
import { englishLocale } from '../globals/config'
import { initPayloadTest } from '../helpers/configHelpers'
import { idToString } from '../helpers/idToString'
import { RESTClient } from '../helpers/rest'
import { arrayCollectionSlug } from './collections/Array'
import { groupSlug } from './collections/Group'
import { nestedToArrayAndBlockCollectionSlug } from './collections/NestedToArrayAndBlock'
import { tabSlug } from './collections/Tab'
import configPromise from './config'
import { defaultLocale, hungarianLocale, localizedSortSlug } from './shared'
import {
  englishTitle,
  localizedPostsSlug,
  portugueseLocale,
  relationEnglishTitle,
  relationEnglishTitle2,
  relationSpanishTitle,
  relationSpanishTitle2,
  relationshipLocalizedSlug,
  spanishLocale,
  spanishTitle,
  withLocalizedRelSlug,
  withRequiredLocalizedFields,
} from './shared'

const collection = localizedPostsSlug
let config: Config
let client: RESTClient

let serverURL

describe('Localization', () => {
  let post1: LocalizedPost
  let postWithLocalizedData: LocalizedPost

  beforeAll(async () => {
    ;({ serverURL } = await initPayloadTest({ __dirname, init: { local: false } }))
    client = new RESTClient(config, { defaultSlug: collection, serverURL })
    await client.create({
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    await client.login()

    config = await configPromise

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

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
    }
  })

  describe('Localized text', () => {
    it('create english', async () => {
      const allDocs = await payload.find({
        collection,
        where: {
          title: { equals: post1.title },
        },
      })
      expect(allDocs.docs).toContainEqual(expect.objectContaining(post1))
    })

    it('add spanish translation', async () => {
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

    it('should fallback to english translation when empty', async () => {
      await payload.update({
        id: post1.id,
        collection,
        data: {
          title: '',
        },
        locale: spanishLocale,
      })

      const retrievedInEnglish = await payload.findByID({
        id: post1.id,
        collection,
      })

      expect(retrievedInEnglish.title).toEqual(englishTitle)

      const localizedFallback: any = await payload.findByID({
        id: post1.id,
        collection,
        locale: 'all',
      })

      expect(localizedFallback.title.en).toEqual(englishTitle)
      expect(localizedFallback.title.es).toEqual('')
    })

    describe('fallback locales', () => {
      let englishData
      let spanishData
      let localizedDoc

      beforeAll(async () => {
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

      it('should return localized fields using fallbackLocale specified in the requested locale config', async () => {
        const portugueseDoc = await payload.findByID({
          id: localizedDoc.id,
          collection: localizedPostsSlug,
          locale: portugueseLocale,
        })

        expect(portugueseDoc.title).toStrictEqual(spanishData.title)
        expect(portugueseDoc.localizedCheckbox).toStrictEqual(true)
      })
    })

    describe('querying', () => {
      let localizedPost: LocalizedPost
      beforeEach(async () => {
        const { id } = await payload.create({
          collection,
          data: {
            title: englishTitle,
          },
        })

        // @ts-expect-error Force typing
        localizedPost = await payload.update({
          id,
          collection,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
        })
      })

      it('unspecified locale returns default', async () => {
        const localized = await payload.findByID({
          id: localizedPost.id,
          collection,
        })

        expect(localized.title).toEqual(englishTitle)
      })

      it('specific locale - same as default', async () => {
        const localized = await payload.findByID({
          id: localizedPost.id,
          collection,
          locale: defaultLocale,
        })

        expect(localized.title).toEqual(englishTitle)
      })

      it('specific locale - not default', async () => {
        const localized = await payload.findByID({
          id: localizedPost.id,
          collection,
          locale: spanishLocale,
        })

        expect(localized.title).toEqual(spanishTitle)
      })

      it('all locales', async () => {
        const localized: any = await payload.findByID({
          id: localizedPost.id,
          collection,
          locale: 'all',
        })

        expect(localized.title.en).toEqual(englishTitle)
        expect(localized.title.es).toEqual(spanishTitle)
      })

      it('by localized field value - default locale', async () => {
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

      it('by localized field value - alternate locale', async () => {
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

      it('by localized field value - opposite locale???', async () => {
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
    })

    if (['mongoose'].includes(process.env.PAYLOAD_DATABASE)) {
      describe('Localized sorting', () => {
        let localizedAccentPostOne: LocalizedPost
        let localizedAccentPostTwo: LocalizedPost
        beforeEach(async () => {
          // @ts-expect-error Force typing
          localizedAccentPostOne = await payload.create({
            collection,
            data: {
              title: 'non accent post',
              localizedDescription: 'something',
            },
            locale: englishLocale,
          })

          // @ts-expect-error Force typing
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

        it('should sort alphabetically even with accented letters', async () => {
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

  describe('Localized Sort Count', () => {
    const expectedTotalDocs = 5
    const posts: LocalizedSort[] = []
    beforeAll(async () => {
      for (let i = 1; i <= expectedTotalDocs; i++) {
        const post = await payload.create({
          collection: localizedSortSlug,
          data: {
            title: `EN ${i}`,
            date: new Date(),
          },
          locale: englishLocale,
        })

        posts.push(post)

        await payload.update({
          id: post.id,
          collection: localizedSortSlug,
          data: {
            title: `ES ${i}`,
            date: new Date(),
          },
          locale: spanishLocale,
        })
      }
    })

    it('should have correct totalDocs when unsorted', async () => {
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
    it('should have correct totalDocs when sorted by localized fields', async () => {
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

    it('should return correct order when sorted by localized fields', async () => {
      const { docs: docsAsc } = await payload.find({ collection: localizedSortSlug, sort: 'title' })
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

  describe('Localized Relationship', () => {
    let localizedRelation: LocalizedPost
    let localizedRelation2: LocalizedPost
    let withRelationship: WithLocalizedRelationship

    beforeAll(async () => {
      localizedRelation = await createLocalizedPost({
        title: {
          [defaultLocale]: relationEnglishTitle,
          [spanishLocale]: relationSpanishTitle,
        },
      })
      localizedRelation2 = await createLocalizedPost({
        title: {
          [defaultLocale]: relationEnglishTitle2,
          [spanishLocale]: relationSpanishTitle2,
        },
      })

      // @ts-expect-error Force typing
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

    describe('regular relationship', () => {
      it('can query localized relationship', async () => {
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

      it('specific locale', async () => {
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

      it('all locales', async () => {
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

      it('populates relationships with all locales', async () => {
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

    describe('relationship - hasMany', () => {
      it('default locale', async () => {
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

      it('specific locale', async () => {
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

      it('relationship population uses locale', async () => {
        const result = await payload.findByID({
          id: withRelationship.id,
          collection: withLocalizedRelSlug,
          depth: 1,
          locale: spanishLocale,
        })
        expect((result.localizedRelationship as LocalizedPost).title).toEqual(relationSpanishTitle)
      })

      it('all locales', async () => {
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

    describe('relationTo multi', () => {
      it('by id', async () => {
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

    describe('relationTo multi hasMany', () => {
      it('by id', async () => {
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

  describe('Localized - arrays with nested localized fields', () => {
    it('should allow moving rows and retain existing row locale data', async () => {
      const globalArray: any = await payload.findGlobal({
        slug: 'global-array',
      })

      const reversedArrayRows = [...globalArray.array].reverse()

      const updatedGlobal = await payload.updateGlobal({
        data: {
          array: reversedArrayRows,
        },
        locale: 'all',
        slug: 'global-array',
      })

      expect(updatedGlobal.array[0].text.en).toStrictEqual('test en 2')
      expect(updatedGlobal.array[0].text.es).toStrictEqual('test es 2')
    })
  })

  describe('Localized - required', () => {
    it('should update without passing all required fields', async () => {
      const newDoc = await payload.create({
        collection: withRequiredLocalizedFields,
        data: {
          layout: [
            {
              blockType: 'text',
              text: 'laiwejfilwaje',
            },
          ],
          title: 'hello',
        },
      })

      await payload.update({
        id: newDoc.id,
        collection: withRequiredLocalizedFields,
        data: {
          layout: [
            {
              blockType: 'number',
              number: 12,
            },
          ],
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

      expect(updatedDoc.layout[0].blockType).toStrictEqual('text')

      const spanishDoc = await payload.findByID({
        id: newDoc.id,
        collection: withRequiredLocalizedFields,
        locale: spanishLocale,
      })

      expect(spanishDoc.layout[0].blockType).toStrictEqual('number')
    })
  })

  describe('Localized - GraphQL', () => {
    let token
    let client

    beforeAll(() => {
      // Defining locale=en in graphQL string should not break JWT strategy
      const url = `${serverURL}${config?.routes?.api}${config?.routes?.graphQL}?locale=en`
      client = new GraphQLClient(url)
    })

    it('should allow user to login and retrieve populated localized field', async () => {
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

      const response = await client.request(query)
      const result = response.loginUser

      expect(typeof result.token).toStrictEqual('string')
      expect(typeof result.user.relation.title).toStrictEqual('string')

      token = result.token
    })

    it('should allow retrieval of populated localized fields within meUser', async () => {
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

      const response = await client.request(query, null, {
        Authorization: `JWT ${token}`,
      })

      const result = response.meUser

      expect(typeof result.user.relation.title).toStrictEqual('string')
    })

    it('should create and update collections', async () => {
      const url = `${serverURL}${config?.routes?.api}${config?.routes?.graphQL}`
      const client = new GraphQLClient(url)

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

      const { createLocalizedPost: createResult } = await client.request(create, null, {
        Authorization: `JWT ${token}`,
      })

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

      const { updateLocalizedPost: updateResult } = await client.request(update, null, {
        Authorization: `JWT ${token}`,
      })

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

    it('should query multiple locales', async () => {
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

      const { en, es } = await client.request(query, null, {
        Authorization: `JWT ${token}`,
      })

      expect(en.title).toStrictEqual(englishTitle)
      expect(es.title).toStrictEqual(spanishTitle)
    })
  })

  describe('Localized - Arrays', () => {
    let docID

    beforeAll(async () => {
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

    it('should use default locale as fallback', async () => {
      const spanishDoc = await payload.findByID({
        id: docID,
        collection: arrayCollectionSlug,
        locale: spanishLocale,
      })

      expect(spanishDoc.items[0].text).toStrictEqual(englishTitle)
    })

    it('should use empty array as value', async () => {
      const updatedSpanishDoc = await payload.update({
        id: docID,
        collection: arrayCollectionSlug,
        data: {
          items: [],
        },
        fallbackLocale: null,
        locale: spanishLocale,
      })

      expect(updatedSpanishDoc.items).toStrictEqual([])
    })

    it('should use fallback value if setting null', async () => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(updatedSpanishDoc.items[0].text).toStrictEqual(englishTitle)
    })
  })

  describe('Localized - Field Paths', () => {
    it('should allow querying by non-localized field names ending in a locale', async () => {
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

      const { result: relationshipRes } = await client.find({
        auth: true,
        query: {
          children: {
            in: post1.id,
          },
        },
      })

      expect(relationshipRes.docs.map(({ id }) => id)).toContain(post1.id)

      const { result: nestedFieldRes } = await client.find({
        auth: true,
        query: {
          'group.children': {
            contains: 'some',
          },
        },
      })

      expect(nestedFieldRes.docs.map(({ id }) => id)).toContain(post1.id)
    })
  })

  describe('Nested To Array And Block', () => {
    it('should be equal to the created document', async () => {
      const { id, blocks } = await payload.create({
        collection: nestedToArrayAndBlockCollectionSlug,
        locale: defaultLocale,
        data: {
          blocks: [
            {
              blockType: 'block',
              array: [
                {
                  text: 'english',
                  textNotLocalized: 'test',
                },
              ],
            },
          ],
        },
      })

      await payload.update({
        collection: nestedToArrayAndBlockCollectionSlug,
        locale: spanishLocale,
        id,
        data: {
          blocks: (blocks as { array: { text: string }[] }[]).map((block) => ({
            ...block,
            array: block.array.map((item) => ({ ...item, text: 'spanish' })),
          })),
        },
      })

      const docDefaultLocale = await payload.findByID({
        collection: nestedToArrayAndBlockCollectionSlug,
        locale: defaultLocale,
        id,
      })

      const docSpanishLocale = await payload.findByID({
        collection: nestedToArrayAndBlockCollectionSlug,
        locale: spanishLocale,
        id,
      })

      const rowDefault = docDefaultLocale.blocks[0].array[0]
      const rowSpanish = docSpanishLocale.blocks[0].array[0]

      expect(rowDefault.text).toEqual('english')
      expect(rowDefault.textNotLocalized).toEqual('test')
      expect(rowSpanish.text).toEqual('spanish')
      expect(rowSpanish.textNotLocalized).toEqual('test')
    })
  })

  describe('Localized group and tabs', () => {
    it('should properly create/update/read localized group field', async () => {
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

    it('should properly create/update/read localized field inside of group', async () => {
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

    it('should properly create/update/read deep localized field inside of group', async () => {
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

    it('should create/updated/read localized group with row field', async () => {
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

    it('should properly create/update/read localized tab field', async () => {
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

    it('should properly create/update/read localized field inside of tab', async () => {
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

    it('should properly create/update/read deep localized field inside of tab', async () => {
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
  })

  describe('nested blocks', () => {
    let id
    it('should allow creating nested blocks per locale', async () => {
      const doc = await payload.create({
        collection: 'blocks-fields',
        data: {
          content: [
            {
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
      })

      id = doc.id

      await payload.update({
        collection: 'blocks-fields',
        id,
        locale: 'es',
        data: {
          content: [
            {
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
      })

      const retrieved = await payload.findByID({
        collection: 'blocks-fields',
        id,
        locale: 'all',
      })

      expect(retrieved.content.en[0].content).toHaveLength(1)
      expect(retrieved.content.es[0].content).toHaveLength(1)
    })
  })

  describe('nested arrays', () => {
    it('should not duplicate block rows for blocks within localized array fields', async () => {
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
        },
        {
          blockName: '2',
          blockType: 'someBlock',
          relationWithinBlock: randomDoc.id,
        },
        {
          blockName: '3',
          blockType: 'someBlock',
          relationWithinBlock: randomDoc.id,
        },
      ]

      const blocksWithinArrayES = [
        {
          blockName: '1',
          blockType: 'someBlock',
          relationWithinBlock: randomDoc2.id,
        },
        {
          blockName: '2',
          blockType: 'someBlock',
          relationWithinBlock: randomDoc2.id,
        },
        {
          blockName: '3',
          blockType: 'someBlock',
          relationWithinBlock: randomDoc2.id,
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

    it('should update localized relation within unLocalized array', async () => {
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

  describe('nested fields', () => {
    it('should allow for fields which could contain new tables within localized arrays to be stored', async () => {
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

    it('should duplicate with localized blocks', async () => {
      // This test covers a few things:
      // - make sure localized arrays / blocks work inside of localized groups / tabs
      //    - this is covered with myTab.group.nestedArray2

      const englishText = 'english'
      const spanishText = 'spanish'
      const doc = await payload.create({
        collection: withRequiredLocalizedFields,
        data: {
          layout: [
            {
              blockType: 'text',
              text: englishText,
              nestedArray: [
                {
                  text: 'hello',
                },
                {
                  text: 'goodbye',
                },
              ],
            },
          ],
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
          layout: [
            {
              blockType: 'text',
              text: spanishText,
              nestedArray: [
                {
                  text: 'hola',
                },
                {
                  text: 'adios',
                },
              ],
            },
          ],
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

      const result = await payload.findByID({
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
      expect(result.layout[0].text).toStrictEqual(englishText)

      expect(allLocales.layout.en[0].text).toStrictEqual(englishText)
      expect(allLocales.layout.es[0].text).toStrictEqual(spanishText)

      expect(allLocales.myTab.group.en.nestedText).toStrictEqual('hello')
      expect(allLocales.myTab.group.en.nestedArray2[0].nestedText).toStrictEqual('hello')
      expect(allLocales.myTab.group.en.nestedArray2[1].nestedText).toStrictEqual('goodbye')

      expect(allLocales.myTab.group.es.nestedText).toStrictEqual('hola')
      expect(allLocales.myTab.group.es.nestedArray2[0].nestedText).toStrictEqual('hola')
      expect(allLocales.myTab.group.es.nestedArray2[1].nestedText).toStrictEqual('adios')
    })
  })
})

async function createLocalizedPost(data: {
  title: {
    [defaultLocale]: string
    [spanishLocale]: string
  }
}): Promise<LocalizedPost> {
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
