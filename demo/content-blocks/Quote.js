module.exports = {
  slug: 'quote',
  label: 'Quote',
  fields: [
    {
      name: 'author',
      label: 'Author',
      type: 'input',
      maxLength: 100,
      required: true
    },
    {
      name: 'quote',
      label: 'Quote',
      type: 'textarea',
      height: 100,
      required: true
    },
    {
      name: 'color',
      label: 'Color',
      type: 'input',
      maxLength: 7,
      required: true
    },
  ],
};
