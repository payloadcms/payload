/* eslint-disable no-underscore-dangle */
const path = require('path');

module.exports = {
  slug: 'localized-posts',
  labels: {
    singular: 'Localized Post',
    plural: 'Localized Posts',
  },
  useAsTitle: 'title',
  policies: {
    read: () => true,
  },
  preview: (doc, token) => {
    if (doc.title) {
      return `http://localhost:3000/posts/${doc.title.value}?preview=true&token=${token}`;
    }

    return null;
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
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      height: 100,
      required: true,
      localized: true,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};
