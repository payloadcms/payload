const Conditions = {
  slug: 'conditions',
  labels: {
    singular: 'Conditions',
    plural: 'Conditions',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'enable-test',
      type: 'checkbox',
      label: 'Enable Test',
    },
    {
      name: 'number',
      type: 'number',
      label: 'Number Field',
    },
    {
      name: 'simple-condition',
      type: 'text',
      label: 'Enable Test is checked',
      required: true,
      condition: (_, siblings) => siblings['enable-test'] && siblings['enable-test'].value === true,
    },
    {
      name: 'or-condition',
      type: 'text',
      label: 'Number is greater than 20 OR enable-test is checked',
      required: true,
      condition: (_, siblings) => {
        if (siblings.number && siblings['enable-test']) {
          return siblings.number.value > 20 || siblings['enable-test'].value === true;
        }

        return false;
      },
    },
    {
      name: 'nested-conditions',
      type: 'text',
      label: 'Number is either greater than 20 AND enable-test is checked, OR number is less than 20 and enable-test is NOT checked',
      condition: (_, siblings) => {
        if (siblings.number && siblings['enable-test']) {
          return (siblings.number.value > 20 && siblings['enable-test'].value === true) || (siblings.number.value < 20 && siblings['enable-test'].value === false);
        }

        return false;
      },
    },
  ],
};

module.exports = Conditions;
