import payload from '../../src';
import { initPayloadTest } from '../helpers/configHelpers';

describe('Postgres', () => {
  beforeAll(async () => {
    process.env.PAYLOAD_DROP_DATABASE = 'true';
    await initPayloadTest({ __dirname, init: { local: false } });
  });

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
  });

  it('adds locale to existing doc', async () => {
    const titleES = 'hello es';
    const arrayTitle = 'hello 1 spanish';
    const blockLocalizedText = 'my block in spanish';

    const updatedPost = await payload.update({
      collection: 'posts',
      id: post.id,
      locale: 'es',
      data: {
        title: titleES,
        number: 1000,
        myArray: [
          {
            id: post.myArray[0].id,
            subField: arrayTitle,
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
    expect(updatedPost.myArray[0].subField).toStrictEqual(arrayTitle);
    expect(updatedPost.myBlocks[0].localizedText).toStrictEqual(blockLocalizedText);
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
            value: person1.id,
          },
        ],
        myArray: [
          {
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
            blockType: 'block1',
            nonLocalizedText: 'hello updated',
            localizedText: 'hello in english updated',
          },
          {
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
  });
});
