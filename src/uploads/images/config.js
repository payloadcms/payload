export default {
  fields: [
    {
      name: 'sizes',
      type: 'repeater',
      id: false,
      fields: [
        {
          name: 'height',
          type: 'number',
        },
        {
          name: 'width',
          type: 'number',
        },
      ],
    }
  ]
}
