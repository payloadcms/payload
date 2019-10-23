module.exports = {
  slug: 'cta',
  label: 'CTA',
  fields: [
    {
      name: 'label',
      label: 'Label',
      type: 'input',
      localized: true,
      maxLength: 100,
      required: true
    },
    {
      name: 'url',
      label: 'URL',
      type: 'input',
      height: 100,
      required: true
    },
  ],
  timestamps: true
};
