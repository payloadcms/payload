import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { LocalizedArrays } from './collections/LocalizedArrays';
import { LocalizedBlocks } from './collections/LocalizedBlocks';
import { LocalizedGroups } from './collections/LocalizedGroups';
import { Pages } from './collections/Pages';
import { People } from './collections/People';
import { Posts } from './collections/Posts';
import { MainMenu } from './globals/MainMenu';

const config = buildConfigWithDefaults({
  collections: [
    LocalizedArrays,
    LocalizedBlocks,
    LocalizedGroups,
    Pages,
    People,
    Posts,
  ],
  globals: [
    MainMenu,
  ],
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
  onInit: async (payload) => {
    // await payload.create({
    //   collection: 'users',
    //   data: {
    //     email: devUser.email,
    //     password: devUser.password,
    //   },
    // });

    const page1 = await payload.create({
      collection: 'pages',
      data: {
        slug: 'first',
      },
    })

    const page2 = await payload.create({
      collection: 'pages',
      data: {
        slug: 'second',
      },
    })

    const findResult = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'second' } },
    })

    const findOneResult = await payload.findByID({
      collection: 'pages',
      id: page1.id,
    })

    const person1 = await payload.create({
      collection: 'people',
      data: {
        fullName: 'Dan Ribbens',
      },
    })

    const person2 = await payload.create({
      collection: 'people',
      data: {
        fullName: 'Elliot DeNolf',
      },
    })

    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'hello',
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
    })

    await payload.update({
      collection: 'posts',
      id: post.id,
      data: {
        title: 'hello 2',
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
    })
  },
})

export default config
