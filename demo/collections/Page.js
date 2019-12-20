module.exports = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  useAsTitle: 'title',
  policies: {
    create: (req, res, next) => {
      return next();
    },
    read: (req, res, next) => {
      return next();
    },
    update: (req, res, next) => {
      return next();
    },
    destroy: (req, res, next) => {
      return next();
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'input',
      unique: false,
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
      required: true
    },
    {
      name: 'categories',
      label: 'Categories',
      type: 'relationship',
      relationType: 'reference',
      relationTo: 'Category',
      hasMany: true,
      localized: true,
    },
    {
      name: 'image',
      label: 'Image',
      type: 'media',
      required: false
    },
    {
      name: 'author',
      label: 'Written by:',
      type: 'reference',
      reference: {
        to: 'Author',
        nested: true,
        relationship: 'oneToMany'
      }
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
          label: 'Content'
        }
      ]
    },
    {
      name: 'blocks',
      label: 'Flexible Content Blocks',
      type: 'flexible',
      blocks: ['quote', 'cta'],
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
          width: 50
        },
        {
          name: 'metaKeywords',
          type: 'input',
          maxLength: 100,
          label: 'Meta Keywords',
          width: 50
        },
        {
          name: 'metaDesc',
          type: 'textarea',
          label: 'Meta Description',
          height: 100
        }
      ]
    }
  ],
  timestamps: true
};
