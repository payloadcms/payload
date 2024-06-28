import { GraphQLClient } from 'graphql-request'

import type { Config } from '../../packages/payload/src/config/types'
import type { Where } from '../../packages/payload/src/types'
import type { LocalizedPost, WithLocalizedRelationship } from './payload-types'

import payload from '../../packages/payload/src'
import { devUser } from '../credentials'
import { englishLocale } from '../globals/config'
import { initPayloadTest } from '../helpers/configHelpers'
import { idToString } from '../helpers/idToString'
import { RESTClient } from '../helpers/rest'
import { arrayCollectionSlug } from './collections/Array'
import { nestedToArrayAndBlockCollectionSlug } from './collections/NestedToArrayAndBlock'
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

    // @ts-expect-error Force typing
    post1 = await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    })

    // @ts-expect-error Force typing
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
