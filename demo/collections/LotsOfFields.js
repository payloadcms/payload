const fields = [];

let i = 0;

for (i; i < 30; i += 1) {
  fields.push({
    name: `array${i}`,
    type: 'array',
    label: `array${i}`,
    fields: [
      {
        name: `number${i}`,
        type: 'number',
        label: 'Number Field',
      },
      {
        name: `text${i}`,
        type: 'text',
        label: 'Text Field',
      },
    ],
  });

  fields.push({
    name: `text${i}`,
    type: 'text',
    label: `Text ${i}`,
  });
}

// for (i; i < 1000; i += 1) {
//   fields.push({
//     name: `number${i}`,
//     type: 'number',
//     label: 'Number Field',
//   });
// }

const LotsOfFields = {
  slug: 'lots-of-fields',
  labels: {
    singular: 'Lots of Fields Test',
    plural: 'Lots of Fields Tests',
  },
  fields,
};

module.exports = LotsOfFields;
