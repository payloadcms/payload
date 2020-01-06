const HttpStatus = require('http-status');
const checkRoleMiddleware = require('../../../src/auth/checkRoleMiddleware');
const Quote = require('../../content-blocks/Quote');
const CallToAction = require('../../content-blocks/CallToAction');
const List = require('./components/List');

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
    read: (req, res, next) => {
      // allow anonymous access
      next();
    },
    update: checkRoleMiddleware('user', 'admin'),
    destroy: (req, res, next) => {
      if (req.user && req.user.role) {
        next();
        return;
      }
      res.status(HttpStatus.FORBIDDEN)
        .send();
    },
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
      fields: [
        {
          name: 'metaTitle',
          type: 'input',
          maxLength: 100,
          label: 'Meta Title',
          width: 50,
        },
        {
          name: 'metaKeywords',
          type: 'input',
          maxLength: 100,
          label: 'Meta Keywords',
          width: 50,
        },
        {
          name: 'metaDesc',
          type: 'textarea',
          label: 'Meta Description',
          height: 100,
        },
      ],
    },
  ],
  components: {
    List,
  },
  timestamps: true,
};
