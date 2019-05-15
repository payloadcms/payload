export default {
  slug: 'categories',
  label: 'Categories',
  singular: 'Category',
  plural: 'Categories',
  useAsTitle: 'title',
  fields: [
    {
      name: 'title',
      label: 'Category Title',
      type: 'input',
      maxLength: 100,
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      height: 100,
      required: true
    },
  ]
};
