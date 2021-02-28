import { PayloadCollectionConfig } from '../../src/collections/config/types';

const Preview: PayloadCollectionConfig = {
  slug: 'previewable-post',
  labels: {
    singular: 'Previewable Post',
    plural: 'Previewable Posts',
  },
  admin: {
    useAsTitle: 'title',
    preview: (doc, token) => {
      if (doc.title) {
        return `http://localhost:3000/previewable-posts/${doc.title}?preview=true&token=${token}`;
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
