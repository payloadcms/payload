import { CollectionConfig } from '../../src/collections/config/types';

const LocalOperations: CollectionConfig = {
  slug: 'local-operations',
  labels: {
    singular: 'Local Operation',
    plural: 'Local Operations',
  },
  hooks: {
    afterRead: [
      async ({ req, doc }) => {
        const formattedData = { ...doc };
        const localizedPosts = await req.payload.find({
          collection: 'localized-posts',
        });

        const blocksGlobal = await req.payload.findGlobal({
          slug: 'blocks-global',
        });

        formattedData.localizedPosts = localizedPosts;
        formattedData.blocksGlobal = blocksGlobal;

        return formattedData;
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'title',
      required: true,
    },
  ],
};

export default LocalOperations;
