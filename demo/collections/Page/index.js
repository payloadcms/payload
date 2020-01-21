const checkRole = require('../../policies/checkRole');
const Quote = require('../../content-blocks/Quote');
const CallToAction = require('../../content-blocks/CallToAction');
// const List = require('./components/List');

module.exports = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  useAsTitle: 'title',
  policies: {
    // options: create, read, update, delete
    // null or undefined policies will default to requiring auth
    // any policy can use req.user to see that the user is logged
    create: null,
    read: () => true,
    update: user => checkRole(['user', 'admin'], user),
    destroy: user => checkRole(['user', 'admin'], user),
  },
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'input',
      unique: true,
      localized: true,
      maxLength: 100,
      required: true,
    },
    {
      name: 'content',
      label: 'Content',
      type: 'textarea',
      localized: true,
      height: 100,
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'relationship',
      relationType: 'reference',
      relationTo: 'categories',
      hasMany: false,
      localized: true,
    },
    {
      name: 'categories',
      label: 'Categories',
      type: 'relationship',
      relationType: 'reference',
      relationTo: 'categories',
      hasMany: true,
      localized: true,
    },
    {
      name: 'nonLocalizedCategory',
      label: 'Categories',
      type: 'relationship',
      relationType: 'reference',
      relationTo: 'categories',
      hasMany: false,
      localized: false,
    },
    {
      name: 'image',
      label: 'Image',
      type: 'media',
      required: false,
    },
    {
      name: 'author',
      label: 'Written by:',
      type: 'reference',
      reference: {
        to: 'authors',
        nested: true,
        relationship: 'oneToMany',
      },
    },
    {
      name: 'slides',
      label: 'Slides',
      type: 'repeater',
      id: false,
      fields: [
        {
          name: 'content',
          type: 'textarea',
          label: 'Content',
        },
      ],
    },
    {
      name: 'layout',
      label: 'Layout Blocks',
      type: 'flexible',
      blocks: [Quote, CallToAction],
      localized: true,
    },
    {
      label: 'Meta Information',
      type: 'group',
      name: 'meta',
      fields: [
        {
          name: 'title',
          type: 'input',
          maxLength: 100,
          label: 'Title',
          width: 50,
        },
        {
          name: 'keywords',
          type: 'input',
          maxLength: 100,
          label: 'Keywords',
          width: 50,
        },
        {
          name: 'desc',
          type: 'textarea',
          label: 'Description',
          height: 100,
        },
      ],
    },
  ],
  components: {
    // List,
  },
  timestamps: true,
};
