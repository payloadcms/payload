import { CollectionConfig } from '../../src/collections/config/types';

const Preview: CollectionConfig = {
  slug: 'previewable-post',
  labels: {
    singular: 'Previewable Post',
    plural: 'Previewable Posts',
  },
  admin: {
    useAsTitle: 'title',
    preview: (doc, { token }) => {
      const { title } = doc;
      if (title) {
        return `http://localhost:3000/previewable-posts/${title}?preview=true&token=${token}`;
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
