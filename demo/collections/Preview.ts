import { CollectionConfig } from '../../src/collections/config/types';

const Preview: CollectionConfig = {
  slug: 'previewable-post',
  labels: {
    singular: 'Previewable Post',
    plural: 'Previewable Posts',
  },
  admin: {
    useAsTitle: 'title',
    preview: async (doc, { token }) => {
      const { title } = doc;
      if (title) {
        const mockAsyncReq = await fetch(`http://localhost:3000/api/previewable-post?depth=0`);
        const mockJSON = await mockAsyncReq.json();
        const mockParam = mockJSON?.docs?.[0]?.title || '';
        return `http://localhost:3000/previewable-posts/${title}?preview=true&token=${token}&mockParam=${mockParam}`;
      }

      return null;
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
      unique: true,
      localized: true,
    },
  ],
  timestamps: true,
};

export default Preview;
