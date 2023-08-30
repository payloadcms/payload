import payload from '../../src';
import { initPayloadTest } from '../helpers/configHelpers';

describe('Postgres', () => {
  beforeAll(async () => {
    process.env.PAYLOAD_DROP_DATABASE = 'true';
    await initPayloadTest({ __dirname, init: { local: false } });
  });

  describe('complex docs', () => {
    let post;
    let page1;
    let page2;
    let person1;
    let person2;

    it('creates a complex doc', async () => {
      page1 = await payload.create({
        collection: 'pages',
        data: {
          slug: 'first',
        },
      });

      page2 = await payload.create({
        collection: 'pages',
        data: {
          slug: 'second',
        },
      });

      person1 = await payload.create({
        collection: 'people',
        data: {
          fullName: 'Dan Ribbens',
        },
      });

      person2 = await payload.create({
        collection: 'people',
        data: {
          fullName: 'Elliot DeNolf',
        },
      });

      const postTitleEN = 'hello';

      post = await payload.create({
        collection: 'posts',
        data: {
          title: postTitleEN,
          number: 1337,
          myGroup: {
            subField: 'hello',
            subFieldLocalized: 'hello in english',
            subGroup: {
              subSubField: 'sub hello',
              subSubFieldLocalized: 'sub hello in english',
            },
            groupArray: [
              {
                groupArrayText: 'hello 1',
              },
              {
                groupArrayText: 'hello 2',
              },
            ],
          },
          relationHasOne: page1.id,
          relationHasOnePoly: {
            relationTo: 'people',
            value: person1.id,
          },
          relationHasMany: [page1.id, page2.id],
          relationHasManyPoly: [
            {
              relationTo: 'people',
              value: person1.id,
            },
            {
              relationTo: 'pages',
              value: page2.id,
            },
          ],
          myArray: [
            {
              subField: 'hello 1',
              mySubArray: [
                {
                  subSubField: 'row 1 subrow 1',
                },
                {
                  subSubField: 'row 1 subrow 2',
                },
              ],
            },
            {
              subField: 'hello 2',
              mySubArray: [
                {
                  subSubField: 'row 2 subrow 1',
                },
                {
                  subSubField: 'row 2 subrow 2',
                },
              ],
            },
          ],
          myBlocks: [
            {
              blockType: 'block1',
              nonLocalizedText: 'hello',
              localizedText: 'hello in english',
            },
            {
              blockType: 'block2',
              number: 123,
              blockArray: [
                {
                  subBlockArray: 'row 1',
                },
                {
                  subBlockArray: 'row 2',
                },
              ],
            },
          ],
        },
      });

      expect(post.title).toEqual(postTitleEN);
      expect(post.myBlocks[0].localizedText).toStrictEqual('hello in english');
      expect(post.relationHasOne).toStrictEqual(page1.id);
      expect(post.relationHasOnePoly.value).toStrictEqual(person1.id);
      expect(post.relationHasMany[0]).toStrictEqual(page1.id);
      expect(post.relationHasMany[1]).toStrictEqual(page2.id);
      expect(post.relationHasManyPoly[0].value).toStrictEqual(person1.id);
      expect(post.relationHasManyPoly[1].value).toStrictEqual(page2.id);
    });

    it('adds locale to existing doc', async () => {
      const titleES = 'hello es';
      const arrayTitle1 = 'hello 1 spanish';
      const arrayTitle2 = 'hello 2 spanish';
      const blockLocalizedText = 'my block in spanish';

      const updatedPost = await payload.update({
        collection: 'posts',
        id: post.id,
        locale: 'es',
        data: {
          title: titleES,
          number: 1000,
          relationHasOne: page2.id,
          relationHasOnePoly: {
            relationTo: 'people',
            value: person2.id,
          },
          relationHasMany: [page2.id, page1.id],
          relationHasManyPoly: [
            {
              relationTo: 'pages',
              value: page1.id,
            },
            {
              relationTo: 'people',
              value: person1.id,
            },
          ],
          myArray: [
            {
              id: post.myArray[0].id,
              subField: arrayTitle1,
            },
            {
              id: post.myArray[1].id,
              subField: arrayTitle2,
            },
          ],
          myBlocks: [
            {
              id: post.myBlocks[0].id,
              localizedText: blockLocalizedText,
            },
          ],
        },
      });

      expect(updatedPost.title).toStrictEqual(titleES);
      expect(updatedPost.number).toStrictEqual(1000);
      expect(updatedPost.myArray[0].subField).toStrictEqual(arrayTitle1);
      expect(updatedPost.myArray[1].subField).toStrictEqual(arrayTitle2);
      expect(updatedPost.myBlocks[0].localizedText).toStrictEqual(blockLocalizedText);
      expect(updatedPost.relationHasOne).toStrictEqual(page2.id);
      expect(updatedPost.relationHasOnePoly.value).toStrictEqual(person2.id);
      expect(updatedPost.relationHasMany[0]).toStrictEqual(page2.id);
      expect(updatedPost.relationHasMany[1]).toStrictEqual(page1.id);
      expect(updatedPost.relationHasManyPoly[0].value).toStrictEqual(page1.id);
      expect(updatedPost.relationHasManyPoly[1].value).toStrictEqual(person1.id);
    });

    it('updates original locale', async () => {
      const updatedTitle = 'hello 3';

      const updatedPost = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          title: 'hello 3',
          number: 1338,
          myGroup: {
            subFieldLocalized: 'hello in english updated',
            subGroup: {
              subSubField: 'sub hello updated',
              subSubFieldLocalized: 'sub hello in english updated',
            },
            groupArray: [
              {
                groupArrayText: 'hello 1 updated',
              },
              {
                groupArrayText: 'hello 2 updated',
              },
            ],
          },
          relationHasOne: page2.id,
          relationHasOnePoly: {
            relationTo: 'people',
            value: person2.id,
          },
          relationHasMany: [page2.id, page1.id],
          relationHasManyPoly: [
            {
              relationTo: 'pages',
              value: page2.id,
            },
            {
              relationTo: 'people',
              value: person2.id,
            },
          ],
          myArray: [
            {
              id: post.myArray[0].id,
              subField: 'hello 1 updated',
              mySubArray: [
                {
                  subSubField: 'row 1 subrow 1 updated',
                },
                {
                  subSubField: 'row 1 subrow 2 updated',
                },
              ],
            },
            {
              id: post.myArray[1].id,
              subField: 'hello 2 updated',
              mySubArray: [
                {
                  subSubField: 'row 2 subrow 1 updated',
                },
                {
                  subSubField: 'row 2 subrow 2 updated',
                },
              ],
            },
          ],
          myBlocks: [
            {
              id: post.myBlocks[0].id,
              blockType: 'block1',
              nonLocalizedText: 'hello updated',
              localizedText: 'hello in english updated',
            },
            {
              id: post.myBlocks[1].id,
              blockType: 'block2',
              number: 1234,
              blockArray: [
                {
                  subBlockArray: 'row 1 updated',
                },
                {
                  subBlockArray: 'row 2 updated',
                },
              ],
            },
          ],
        },
      });

      expect(updatedPost.title).toStrictEqual(updatedTitle);
      expect(updatedPost.myArray[0].subField).toStrictEqual('hello 1 updated');
      expect(updatedPost.myArray[1].subField).toStrictEqual('hello 2 updated');
      expect(updatedPost.myBlocks[0].localizedText).toStrictEqual('hello in english updated');
    });

    it('retrieves doc in all locales', async () => {
      const postAllLocales = await payload.findByID({
        collection: 'posts',
        id: post.id,
        locale: 'all',
      });

      expect(postAllLocales.title.en).toStrictEqual('hello 3');
      expect(postAllLocales.title.es).toStrictEqual('hello es');
      expect(postAllLocales.number.en).toStrictEqual(1338);
      expect(postAllLocales.number.es).toStrictEqual(1000);
      expect(postAllLocales.myBlocks[0].localizedText.en).toStrictEqual('hello in english updated');
      expect(postAllLocales.myArray[0].subField.es).toStrictEqual('hello 1 spanish');

      expect(postAllLocales.relationHasOne.en).toStrictEqual(page2.id);
      expect(postAllLocales.relationHasOnePoly.en.value).toStrictEqual(person2.id);
      expect(postAllLocales.relationHasMany.en[0]).toStrictEqual(page2.id);
      expect(postAllLocales.relationHasMany.en[1]).toStrictEqual(page1.id);
      expect(postAllLocales.relationHasManyPoly.en[0].value).toStrictEqual(page2.id);
      expect(postAllLocales.relationHasManyPoly.en[1].value).toStrictEqual(person2.id);

      expect(postAllLocales.relationHasOne.es).toStrictEqual(page2.id);
      expect(postAllLocales.relationHasOnePoly.es.value).toStrictEqual(person2.id);
      expect(postAllLocales.relationHasMany.es[0]).toStrictEqual(page2.id);
      expect(postAllLocales.relationHasMany.es[1]).toStrictEqual(page1.id);
      expect(postAllLocales.relationHasManyPoly.es[0].value).toStrictEqual(page1.id);
      expect(postAllLocales.relationHasManyPoly.es[1].value).toStrictEqual(person1.id);
    });

    // it('queries complex docs', async () => {
    //   const query = await payload.find({
    //     collection: 'posts',
    //   });

    //   expect(query.docs[0].title).toStrictEqual('hello 3');
    // });

    // it('queries by normal field', async () => {
    //   const queried = await payload.find({
    //     collection: 'people',
    //     where: {
    //       fullName: {
    //         equals: 'Dan Ribbens',
    //       },
    //     },
    //   });

    //   expect(queried.docs[0].fullName).toStrictEqual('Dan Ribbens');
    // });

    // it('queries by localized field', async () => {
    //   const queried = await payload.find({
    //     collection: 'posts',
    //     where: {
    //       title: {
    //         equals: 'hello 3',
    //       },
    //     },
    //   });

    //   expect(queried.docs[0].title).toStrictEqual('hello 3');
    // });
  });

  describe('localized arrays', () => {
    let localizedArray;

    it('creates localized array', async () => {
      localizedArray = await payload.create({
        collection: 'localized-arrays',
        data: {
          array: [
            {
              text: 'hello in english',
            },
            {
              text: 'hello 2 in english',
            },
          ],
        },
      });

      expect(localizedArray.array[0].text).toStrictEqual('hello in english');
      expect(localizedArray.array[1].text).toStrictEqual('hello 2 in english');
    });

    it('adds localized rows', async () => {
      const updated = await payload.update({
        collection: 'localized-arrays',
        id: localizedArray.id,
        locale: 'es',
        data: {
          array: [
            {
              text: 'hello in spanish',
            },
            {
              text: 'hello 2 in spanish',
            },
          ],
        },
      });

      expect(updated.array[0].text).toStrictEqual('hello in spanish');
      expect(updated.array[1].text).toStrictEqual('hello 2 in spanish');
    });

    it('retrieves array field in all locales', async () => {
      const retrievedArray = await payload.findByID({
        collection: 'localized-arrays',
        id: localizedArray.id,
        locale: 'all',
      });

      expect(retrievedArray.array.en[0].text).toStrictEqual('hello in english');
      expect(retrievedArray.array.en[1].text).toStrictEqual('hello 2 in english');
      expect(retrievedArray.array.es[0].text).toStrictEqual('hello in spanish');
      expect(retrievedArray.array.es[1].text).toStrictEqual('hello 2 in spanish');
    });
  });

  describe('localized blocks', () => {
    let localizedBlocks;

    it('creates localized blocks', async () => {
      localizedBlocks = await payload.create({
        collection: 'localized-blocks',
        data: {
          title: 'hello',
          layout: [
            {
              blockType: 'text',
              text: 'hello in english',
            },
            {
              blockType: 'number',
              number: 1337,
            },
          ],
        },
      });

      expect(localizedBlocks.layout[0].text).toStrictEqual('hello in english');
      expect(localizedBlocks.layout[1].number).toStrictEqual(1337);
    });

    it('adds localized blocks', async () => {
      const updated = await payload.update({
        collection: 'localized-blocks',
        id: localizedBlocks.id,
        locale: 'es',
        data: {
          title: 'hello in spanish',
          layout: [
            {
              blockType: 'text',
              text: 'hello in spanish',
            },
            {
              blockType: 'number',
              number: 1338,
            },
          ],
        },
      });

      expect(updated.layout[0].text).toStrictEqual('hello in spanish');
      expect(updated.layout[1].number).toStrictEqual(1338);
    });

    it('retrieves blocks field in all locales', async () => {
      const retrievedBlocks = await payload.findByID({
        collection: 'localized-blocks',
        id: localizedBlocks.id,
        locale: 'all',
      });

      expect(retrievedBlocks.layout.en[0].text).toStrictEqual('hello in english');
      expect(retrievedBlocks.layout.en[1].number).toStrictEqual(1337);
      expect(retrievedBlocks.layout.es[0].text).toStrictEqual('hello in spanish');
      expect(retrievedBlocks.layout.es[1].number).toStrictEqual(1338);
    });
  });

  describe('localized group', () => {
    let localizedGroup;

    it('creates localized group', async () => {
      localizedGroup = await payload.create({
        collection: 'localized-groups',
        data: {
          group: {
            text: 'en',
            number: 123,
          },
        },
      });

      expect(localizedGroup.group.text).toStrictEqual('en');
      expect(localizedGroup.group.number).toStrictEqual(123);
    });

    it('adds localized group', async () => {
      const updated = await payload.update({
        collection: 'localized-groups',
        id: localizedGroup.id,
        locale: 'es',
        data: {
          group: {
            text: 'es',
            number: 456,
          },
        },
      });

      expect(updated.group.text).toStrictEqual('es');
      expect(updated.group.number).toStrictEqual(456);
    });

    it('retrieves group field in all locales', async () => {
      const retrievedGroup = await payload.findByID({
        collection: 'localized-groups',
        id: localizedGroup.id,
        locale: 'all',
      });

      expect(retrievedGroup.group.en.text).toStrictEqual('en');
      expect(retrievedGroup.group.en.number).toStrictEqual(123);
      expect(retrievedGroup.group.es.text).toStrictEqual('es');
      expect(retrievedGroup.group.es.number).toStrictEqual(456);
    });
  });

  describe('globals', () => {
    let mainMenu;
    it('creates global', async () => {
      mainMenu = await payload.updateGlobal({
        slug: 'main-menu',
        data: {
          title: 'hello in english',
          nonLocalizedField: 'hello',
          array: [
            {
              localizedText: 'row 1 en',
            },
            {
              localizedText: 'row 2 en',
            },
          ],
        },
      });

      expect(mainMenu.title).toStrictEqual('hello in english');
      expect(mainMenu.nonLocalizedField).toStrictEqual('hello');
      expect(mainMenu.array[0].localizedText).toStrictEqual('row 1 en');
      expect(mainMenu.array[1].localizedText).toStrictEqual('row 2 en');
    });

    it('adds locale to global', async () => {
      const updated = await payload.updateGlobal({
        slug: 'main-menu',
        locale: 'es',
        data: {
          title: 'hello in spanish',
          array: [
            {
              id: mainMenu.array[0].id,
              localizedText: 'row 1 es',
            },
            {
              id: mainMenu.array[1].id,
              localizedText: 'row 2 es',
            },
          ],
        },
      });

      expect(updated.title).toStrictEqual('hello in spanish');
      expect(updated.nonLocalizedField).toStrictEqual('hello');
      expect(updated.array[0].localizedText).toStrictEqual('row 1 es');
      expect(updated.array[1].localizedText).toStrictEqual('row 2 es');
    });

    it('retrieves global in all locales', async () => {
      const retrieved = await payload.findGlobal({
        slug: 'main-menu',
        locale: 'all',
      });

      expect(retrieved.title.en).toStrictEqual('hello in english');
      expect(retrieved.title.es).toStrictEqual('hello in spanish');
      expect(retrieved.nonLocalizedField).toStrictEqual('hello');
      expect(retrieved.array[0].localizedText.en).toStrictEqual('row 1 en');
      expect(retrieved.array[1].localizedText.en).toStrictEqual('row 2 en');
      expect(retrieved.array[0].localizedText.es).toStrictEqual('row 1 es');
      expect(retrieved.array[1].localizedText.es).toStrictEqual('row 2 es');
    });
  });
});
