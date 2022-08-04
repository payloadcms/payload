import mongoose from 'mongoose';
import { GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';
import type { LocalizedPost, WithLocalizedRelationship, LocalizedRequired } from './payload-types';
import type { LocalizedPostAllLocale } from './config';
import config, { slug, withLocalizedRelSlug, withRequiredLocalizedFields } from './config';
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

const collection = config.collections[1]?.slug;

let serverURL;

describe('Localization', () => {
  let post1: LocalizedPost;
  let postWithLocalizedData: LocalizedPost;

  beforeAll(async () => {
    ({ serverURL } = await initPayloadTest({ __dirname, init: { local: false } }));

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

    await payload.update<LocalizedPost>({
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
      const allDocs = await payload.find<LocalizedPost>({
        collection,
        where: {
          title: { equals: post1.title },
        },
      });
      expect(allDocs.docs).toContainEqual(expect.objectContaining(post1));
    });

    it('add spanish translation', async () => {
      const updated = await payload.update<LocalizedPost>({
        collection,
        id: post1.id,
        locale: spanishLocale,
        data: {
          title: spanishTitle,
        },
      });

      expect(updated.title).toEqual(spanishTitle);

      const localized = await payload.findByID<LocalizedPostAllLocale>({
        collection,
        id: post1.id,
        locale: 'all',
      });

      expect(localized.title.en).toEqual(englishTitle);
      expect(localized.title.es).toEqual(spanishTitle);
    });

    describe('querying', () => {
      let localizedPost: LocalizedPost;
      beforeEach(async () => {
        const { id } = await payload.create<LocalizedPost>({
          collection,
          data: {
            title: englishTitle,
          },
        });

        localizedPost = await payload.update<LocalizedPost>({
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
        const localized = await payload.findByID<LocalizedPostAllLocale>({
          collection,
          locale: 'all',
          id: localizedPost.id,
        });

        expect(localized.title.en).toEqual(englishTitle);
        expect(localized.title.es).toEqual(spanishTitle);
      });

      it('by localized field value - default locale', async () => {
        const result = await payload.find<LocalizedPost>({
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
        const result = await payload.find<LocalizedPost>({
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
        const result = await payload.find<LocalizedPost>({
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
            const result = await payload.find<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              where: {
                'localizedRelation.title': {
                  equals: localizedRelation.title,
                },
              },
            });

            expect(result.docs[0].id).toEqual(withRelationship.id);
          });

          it('specific locale', async () => {
            const result = await payload.find<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              locale: spanishLocale,
              where: {
                'localizedRelation.title': {
                  equals: relationSpanishTitle,
                },
              },
            });

            expect(result.docs[0].id).toEqual(withRelationship.id);
          });

          it('all locales', async () => {
            const result = await payload.find<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              locale: 'all',
              where: {
                'localizedRelation.title.es': {
                  equals: relationSpanishTitle,
                },
              },
            });

            expect(result.docs[0].id).toEqual(withRelationship.id);
          });
        });

        describe('relationship - hasMany', () => {
          it('default locale', async () => {
            const result = await payload.find<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              where: {
                'localizedRelationHasManyField.title': {
                  equals: localizedRelation.title,
                },
              },
            });

            expect(result.docs[0].id).toEqual(withRelationship.id);

            // Second relationship
            const result2 = await payload.find<WithLocalizedRelationship>({
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
            const result = await payload.find<WithLocalizedRelationship>({
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
            const result2 = await payload.find<WithLocalizedRelationship>({
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
            const result = await payload.findByID<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              depth: 1,
              id: withRelationship.id,
              locale: spanishLocale,
            });
            expect((result.localizedRelationship as LocalizedPost).title).toEqual(relationSpanishTitle);
          });

          it('all locales', async () => {
            const queryRelation = (where: Where) => {
              return payload.find<WithLocalizedRelationship>({
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
            const result = await payload.find<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              where: {
                'localizedRelationMultiRelationTo.value': {
                  equals: localizedRelation.id,
                },
              },
            });

            expect(result.docs[0].id).toEqual(withRelationship.id);

            // Second relationship
            const result2 = await payload.find<WithLocalizedRelationship>({
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
            const result = await payload.find<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              where: {
                'localizedRelationMultiRelationToHasMany.value': {
                  equals: localizedRelation.id,
                },
              },
            });

            expect(result.docs[0].id).toEqual(withRelationship.id);

            // First relationship - spanish locale
            const result2 = await payload.find<WithLocalizedRelationship>({
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
            const result3 = await payload.find<WithLocalizedRelationship>({
              collection: withLocalizedRelSlug,
              where: {
                'localizedRelationMultiRelationToHasMany.value': {
                  equals: localizedRelation2.id,
                },
              },
            });

            expect(result3.docs[0].id).toEqual(withRelationship.id);

            // Second relationship - spanish locale
            const result4 = await payload.find<WithLocalizedRelationship>({
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

      const updatedDoc = await payload.update<LocalizedRequired>({
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
      const url = `${serverURL}${config.routes.api}${config.routes.graphQL}?locale=en`;
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
      const url = `${serverURL}${config.routes.api}${config.routes.graphQL}?locale=en`;
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
  });
});

async function createLocalizedPost(data: {
  title: {
    [defaultLocale]: string;
    [spanishLocale]: string;
  };
}): Promise<LocalizedPost> {
  const localizedRelation = await payload.create<LocalizedPost>({
    collection,
    data: {
      title: data.title.en,
    },
  });

  await payload.update<LocalizedPost>({
    collection,
    id: localizedRelation.id,
    locale: spanishLocale,
    data: {
      title: data.title.es,
    },
  });

  return localizedRelation;
}
