import {buildConfig} from '../buildConfig';

const openAccess={
  create: () => true,
  read: () => true,
  update: () => true,
  delete: () => true,
};

export const slug='seven-eleven';

export default buildConfig({
  collections: [
    {
      slug,
      access: openAccess,
      fields: [
        {
          name: 'uid',
          type: 'number',
        },
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'domain',
          type: 'text',
        },
        {
          name: 'color',
          type: 'select',
          options: [
            {label: 'red', value: 'red'},
            {label: 'black', value: 'black'}
          ]
        },
      ],
      indexes: [
        {fields: {uid: 1}, options: {unique: true}},
        {fields: {name: 1, domain: 1}, options: {unique: true, sparse: true}}
      ]
    }
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: slug,
      data: {
        uid: 1001,
        name: 'coffee',
        domain: 'a',
        color: 'red'
      },
    });

    await payload.create({
      collection: slug,
      data: {
        uid: 1002,
        name: 'bread',
        domain: 'a',
        color: 'black'
      },
    });

    await payload.create({
      collection: slug,
      data: {
        uid: 1003,
        name: 'beef',
        domain: 'a',
        color: 'red'
      },
    });
  },
});
