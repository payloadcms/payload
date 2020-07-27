const LocalOperations = {
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

        formattedData.localizedPosts = localizedPosts;

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

module.exports = LocalOperations;
