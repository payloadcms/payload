import mongoose from 'mongoose';
import { GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';
import type {
  LocalizedPost,
  WithLocalizedRelationship,
} from './payload-types';
import configPromise, { relationshipLocalizedSlug, slug, withLocalizedRelSlug, withRequiredLocalizedFields } from './config';
import {
  defaultLocale,
  englishTitle,
  relationEnglishTitle,
  relationEnglishTitle2,
  relationSpanishTitle,
  relationSpanishTitle2,
  spanishLocale,
  spanishTitle,
} from './shared';
import type { Where } from '../../src/types';
import { arrayCollectionSlug } from './collections/Array';
import type { Config } from '../../src/config/types';

const collection = slug;
let config: Config;

let serverURL;

describe('Localization', () => {
  let post1: LocalizedPost;
  let postWithLocalizedData: LocalizedPost;

  beforeAll(async () => {
    ({ serverURL } = await initPayloadTest({ __dirname, init: { local: false } }));
    config = await configPromise;

    post1 = await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    });

    postWithLocalizedData = await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    });

    await payload.update({
      collection,
      id: postWithLocalizedData.id,
      locale: spanishLocale,
      data: {
        title: spanishTitle,
      },
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  describe('localized text', () => {
    it('create english', async () => {
      const allDocs = await payload.find({
        collection,
        where: {
          title: { equals: post1.title },
        },
      });
      expect(allDocs.docs).toContainEqual(expect.objectContaining(post1));
    });

    it('add spanish translation', async () => {
      const updated = await payload.update({
        collection,
        id: post1.id,
        locale: spanishLocale,
        data: {
          title: spanishTitle,
        },
      });

      expect(updated.title).toEqual(spanishTitle);

      const localized = await payload.findByID({
        collection,
        id: post1.id,
        locale: 'all',
      });

      expect(localized.title.en).toEqual(englishTitle);
      expect(localized.title.es).toEqual(spanishTitle);
    });

    it('should fallback to english translation when empty', async () => {
      const updated = await payload.update({
        collection,
        id: post1.id,
        locale: spanishLocale,
        data: {
          title: '',
        },
      });

      expect(updated.title).toEqual(englishTitle);

      const localizedFallback = await payload.findByID({
        collection,
        id: post1.id,
        locale: 'all',
      });

      expect(localizedFallback.title.en).toEqual(englishTitle);
      expect(localizedFallback.title.es).toEqual('');
    });

    describe('querying', () => {
      let localizedPost: LocalizedPost;
      beforeEach(async () => {
        const { id } = await payload.create({
          collection,
          data: {
            title: englishTitle,
          },
        });

        localizedPost = await payload.update({
          collection,
          id,
          locale: spanishLocale,
          data: {
            title: spanishTitle,
          },
        });
      });

      it('unspecified locale returns default', async () => {
        const localized = await payload.findByID({
          collection,
          id: localizedPost.id,
        });

        expect(localized.title).toEqual(englishTitle);
      });

      it('specific locale - same as default', async () => {
        const localized = await payload.findByID({
          collection,
          locale: defaultLocale,
          id: localizedPost.id,
        });

        expect(localized.title).toEqual(englishTitle);
      });

      it('specific locale - not default', async () => {
        const localized = await payload.findByID({
          collection,
          locale: spanishLocale,
          id: localizedPost.id,
        });

        expect(localized.title).toEqual(spanishTitle);
      });

      it('all locales', async () => {
        const localized = await payload.findByID({
          collection,
          locale: 'all',
          id: localizedPost.id,
        });

        expect(localized.title.en).toEqual(englishTitle);
        expect(localized.title.es).toEqual(spanishTitle);
      });

      it('by localized field value - default locale', async () => {
        const result = await payload.find({
          collection,
          where: {
            title: {
              equals: englishTitle,
            },
          },
        });

        expect(result.docs[0].id).toEqual(localizedPost.id);
      });

      it('by localized field value - alternate locale', async () => {
        const result = await payload.find({
          collection,
          locale: spanishLocale,
          where: {
            title: {
              equals: spanishTitle,
            },
          },
        });

        expect(result.docs[0].id).toEqual(localizedPost.id);
      });

      it('by localized field value - opposite locale???', async () => {
        const result = await payload.find({
          collection,
          locale: 'all',
          where: {
            'title.es': {
              equals: spanishTitle,
            },
          },
        });

        expect(result.docs[0].id).toEqual(localizedPost.id);
      });
    });
  });

  describe('Localized Relationship', () => {
    let localizedRelation: LocalizedPost;
    let localizedRelation2: LocalizedPost;
    let withRelationship: WithLocalizedRelationship;

    beforeAll(async () => {
      localizedRelation = await createLocalizedPost({
        title: {
          [defaultLocale]: relationEnglishTitle,
          [spanishLocale]: relationSpanishTitle,
        },
      });
      localizedRelation2 = await createLocalizedPost({
        title: {
          [defaultLocale]: relationEnglishTitle2,
          [spanishLocale]: relationSpanishTitle2,
        },
      });

      withRelationship = await payload.create({
        collection: withLocalizedRelSlug,
        data: {
          localizedRelationship: localizedRelation.id,
          localizedRelationHasManyField: [localizedRelation.id, localizedRelation2.id],
          localizedRelationMultiRelationTo: { relationTo: slug, value: localizedRelation.id },
          localizedRelationMultiRelationToHasMany: [
            { relationTo: slug, value: localizedRelation.id },
            { relationTo: slug, value: localizedRelation2.id },
          ],
        },
      });
    });

    describe('regular relationship', () => {
      it('can query localized relationship', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationship.title': {
              equals: localizedRelation.title,
            },
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);
      });

      it('specific locale', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationship.title': {
              equals: relationSpanishTitle,
            },
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);
      });

      it('all locales', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          locale: 'all',
          where: {
            'localizedRelationship.title.es': {
              equals: relationSpanishTitle,
            },
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);
      });

      it('populates relationships with all locales', async () => {
        // the relationship fields themselves are localized on this collection
        const result = await payload.find({
          collection: relationshipLocalizedSlug,
          locale: 'all',
          depth: 1,
        });
        expect((result.docs[0].relationship as any).en.id).toBeDefined();
        expect((result.docs[0].relationshipHasMany as any).en[0].id).toBeDefined();
        expect((result.docs[0].relationMultiRelationTo as any).en.value.id).toBeDefined();
        expect((result.docs[0].relationMultiRelationToHasMany as any).en[0].value.id).toBeDefined();
      });
    });

    describe('relationship - hasMany', () => {
      it('default locale', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationHasManyField.title': {
              equals: localizedRelation.title,
            },
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);

        // Second relationship
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationHasManyField.title': {
              equals: localizedRelation2.title,
            },
          },
        });

        expect(result2.docs[0].id).toEqual(withRelationship.id);
      });

      it('specific locale', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationHasManyField.title': {
              equals: relationSpanishTitle,
            },
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);

        // Second relationship
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationHasManyField.title': {
              equals: relationSpanishTitle2,
            },
          },
        });

        expect(result2.docs[0].id).toEqual(withRelationship.id);
      });

      it('relationship population uses locale', async () => {
        const result = await payload.findByID({
          collection: withLocalizedRelSlug,
          depth: 1,
          id: withRelationship.id,
          locale: spanishLocale,
        });
        expect((result.localizedRelationship as LocalizedPost).title).toEqual(relationSpanishTitle);
      });

      it('all locales', async () => {
        const queryRelation = (where: Where) => {
          return payload.find({
            collection: withLocalizedRelSlug,
            locale: 'all',
            where,
          });
        };

        const result = await queryRelation({
          'localizedRelationHasManyField.title.en': {
            equals: relationEnglishTitle,
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);

        // First relationship - spanish
        const result2 = await queryRelation({
          'localizedRelationHasManyField.title.es': {
            equals: relationSpanishTitle,
          },
        });

        expect(result2.docs[0].id).toEqual(withRelationship.id);

        // Second relationship - english
        const result3 = await queryRelation({
          'localizedRelationHasManyField.title.en': {
            equals: relationEnglishTitle2,
          },
        });

        expect(result3.docs[0].id).toEqual(withRelationship.id);

        // Second relationship - spanish
        const result4 = await queryRelation({
          'localizedRelationHasManyField.title.es': {
            equals: relationSpanishTitle2,
          },
        });

        expect(result4.docs[0].id).toEqual(withRelationship.id);
      });
    });

    describe('relationTo multi', () => {
      it('by id', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationTo.value': {
              equals: localizedRelation.id,
            },
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);

        // Second relationship
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationMultiRelationTo.value': {
              equals: localizedRelation.id,
            },
          },
        });

        expect(result2.docs[0].id).toEqual(withRelationship.id);
      });
    });

    describe('relationTo multi hasMany', () => {
      it('by id', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation.id,
            },
          },
        });

        expect(result.docs[0].id).toEqual(withRelationship.id);

        // First relationship - spanish locale
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation.id,
            },
          },
        });

        expect(result2.docs[0].id).toEqual(withRelationship.id);

        // Second relationship
        const result3 = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation2.id,
            },
          },
        });

        expect(result3.docs[0].id).toEqual(withRelationship.id);

        // Second relationship - spanish locale
        const result4 = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation2.id,
            },
          },
        });

        expect(result4.docs[0].id).toEqual(withRelationship.id);
      });
    });
  });

  describe('Localized - arrays with nested localized fields', () => {
    it('should allow moving rows and retain existing row locale data', async () => {
      const globalArray = await payload.findGlobal({
        slug: 'global-array',
      });

      const reversedArrayRows = [...globalArray.array].reverse();

      const updatedGlobal = await payload.updateGlobal({
        slug: 'global-array',
        locale: 'all',
        data: {
          array: reversedArrayRows,
        },
      });

      expect(updatedGlobal.array[0].text.en).toStrictEqual('test en 2');
      expect(updatedGlobal.array[0].text.es).toStrictEqual('test es 2');
    });
  });

  describe('Localized - required', () => {
    it('should update without passing all required fields', async () => {
      const newDoc = await payload.create({
        collection: withRequiredLocalizedFields,
        data: {
          title: 'hello',
          layout: [
            {
              blockType: 'text',
              text: 'laiwejfilwaje',
            },
          ],
        },
      });

      await payload.update({
        collection: withRequiredLocalizedFields,
        id: newDoc.id,
        locale: spanishLocale,
        data: {
          title: 'en espanol, big bird',
          layout: [
            {
              blockType: 'number',
              number: 12,
            },
          ],
        },
      });

      const updatedDoc = await payload.update({
        collection: withRequiredLocalizedFields,
        id: newDoc.id,
        data: {
          title: 'hello x2',
        },
      });

      expect(updatedDoc.layout[0].blockType).toStrictEqual('text');

      const spanishDoc = await payload.findByID({
        collection: withRequiredLocalizedFields,
        id: newDoc.id,
        locale: spanishLocale,
      });

      expect(spanishDoc.layout[0].blockType).toStrictEqual('number');
    });
  });

  describe('Localized - GraphQL', () => {
    let token;

    it('should allow user to login and retrieve populated localized field', async () => {
      const url = `${serverURL}${config?.routes?.api}${config?.routes?.graphQL}?locale=en`;
      const client = new GraphQLClient(url);

      const query = `mutation {
        loginUser(email: "dev@payloadcms.com", password: "test") {
          token
          user {
            relation {
              title
            }
          }
        }
      }`;

      const response = await client.request(query);
      const result = response.loginUser;

      expect(typeof result.token).toStrictEqual('string');
      expect(typeof result.user.relation.title).toStrictEqual('string');

      token = result.token;
    });

    it('should allow retrieval of populated localized fields within meUser', async () => {
      // Defining locale=en in graphQL string should not break JWT strategy
      const url = `${serverURL}${config?.routes?.api}${config?.routes?.graphQL}?locale=en`;
      const client = new GraphQLClient(url);

      const query = `query {
        meUser {
          user {
            id
            relation {
              title
            }
          }
        }
      }`;

      const response = await client.request(query, null, {
        Authorization: `JWT ${token}`,
      });

      const result = response.meUser;

      expect(typeof result.user.relation.title).toStrictEqual('string');
    });

    it('should create and update collections', async () => {
      const url = `${serverURL}${config?.routes?.api}${config?.routes?.graphQL}`;
      const client = new GraphQLClient(url);

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
      }`;

      const { createLocalizedPost: createResult } = await client.request(create, null, {
        Authorization: `JWT ${token}`,
      });


      const update = `mutation {
        updateLocalizedPost(
          id: "${createResult.id}",
          data: {
            title: "${spanishTitle}"
          }
          locale: ${spanishLocale}
        ) {
          title
        }
      }`;

      const { updateLocalizedPost: updateResult } = await client.request(update, null, {
        Authorization: `JWT ${token}`,
      });

      const result = await payload.findByID({
        collection: slug,
        id: createResult.id,
        locale: 'all',
      });

      expect(createResult.title).toStrictEqual(englishTitle);
      expect(updateResult.title).toStrictEqual(spanishTitle);
      expect(result.title[defaultLocale]).toStrictEqual(englishTitle);
      expect(result.title[spanishLocale]).toStrictEqual(spanishTitle);
    });
  });

  describe('Localized - Arrays', () => {
    let docID;

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
      });

      docID = englishDoc.id;
    });

    it('should use default locale as fallback', async () => {
      const spanishDoc = await payload.findByID({
        locale: spanishLocale,
        collection: arrayCollectionSlug,
        id: docID,
      });

      expect(spanishDoc.items[0].text).toStrictEqual(englishTitle);
    });

    it('should use empty array as value', async () => {
      const updatedSpanishDoc = await payload.update({
        collection: arrayCollectionSlug,
        locale: spanishLocale,
        id: docID,
        data: {
          items: [],
        },
      });

      expect(updatedSpanishDoc.items).toStrictEqual([]);
    });

    it('should use fallback value if setting null', async () => {
      await payload.update({
        collection: arrayCollectionSlug,
        locale: spanishLocale,
        id: docID,
        data: {
          items: [],
        },
      });

      const updatedSpanishDoc = await payload.update({
        collection: arrayCollectionSlug,
        locale: spanishLocale,
        id: docID,
        data: {
          items: null,
        },
      });

      // should return the value of the fallback locale
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(updatedSpanishDoc.items[0].text).toStrictEqual(englishTitle);
    });
  });
});

async function createLocalizedPost(data: {
  title: {
    [defaultLocale]: string;
    [spanishLocale]: string;
  };
}): Promise<LocalizedPost> {
  const localizedRelation = await payload.create({
    collection,
    data: {
      title: data.title.en,
    },
  });

  await payload.update({
    collection,
    id: localizedRelation.id,
    locale: spanishLocale,
    data: {
      title: data.title.es,
    },
  });

  return localizedRelation;
}
