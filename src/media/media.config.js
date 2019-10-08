export default {
  fields: [{
    name: 'filename',
    type: 'input',
  },
    {
      name: 'sizes',
      type: 'repeater',
      fields: [
        {
          name: 'height',
          type: 'number',
          label: 'Height'
        },
        {
          name: 'width',
          type: 'number',
          label: 'Width'
        },
      ]
    }
  ]
}
