module.exports = {
  slug: 'group',
  label: 'Group',
  fields: [
    {
      name: 'nested',
      label: 'Nested Flexible Block',
      type: 'flexible',
      blocks: ['quote', 'cta'],
      hasMany: true,
    },
    {
      name: 'label',
      label: 'Label',
      type: 'input',
      maxLength: 50,
    }
  ],
  timestamps: true
};
