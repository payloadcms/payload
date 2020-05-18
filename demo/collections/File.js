module.exports = {
  slug: 'files',
  labels: {
    singular: 'File',
    plural: 'Files',
  },
  upload: {
    staticURL: '/files',
    staticDir: 'demo/files',
  },
  useAsTitle: 'filename',
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [{
        value: 'Type 1',
        label: 'Type 2',
      }, {
        value: 'Type 2',
        label: 'Type 2 Label',
      }, {
        value: 'Type 3',
        label: 'Type 3 Label',
      }],
      defaultValue: 'Type 1',
      required: true,
    },
  ],
  timestamps: true,
};
