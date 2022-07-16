import mongoose from 'mongoose';
import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';
import type { LocalizedPost } from './payload-types';
import type { LocalizedPostAllLocale } from './config';
import config from './config';
import { defaultLocale, englishTitle, spanishLocale, spanishTitle } from './shared';

const collection = config.collections[0]?.slug;

describe('array-update', () => {
  beforeAll(async () => {
    await initPayloadTest({ __dirname });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  describe('Localization', () => {
    let post1: LocalizedPost;
    beforeAll(async () => {
      post1 = await payload.create({
        collection,
        data: {
          title: englishTitle,
        },
      });
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

          const doc = result.docs[0];
          expect(doc.id).toEqual(localizedPost.id);
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

          const doc = result.docs[0];
          expect(doc.id).toEqual(localizedPost.id);
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

          const doc = result.docs[0];
          expect(doc.id).toEqual(localizedPost.id);
        });
      });
    });
  });
});
