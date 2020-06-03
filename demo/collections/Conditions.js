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
      name: 'enableTest',
      type: 'checkbox',
      label: 'Enable Test',
    },
    {
      name: 'number',
      type: 'number',
      label: 'Number Field',
    },
    {
      name: 'simpleCondition',
      type: 'text',
      label: 'Enable Test is checked',
      required: true,
      condition: (_, siblings) => siblings.enableTest && siblings.enableTest.value === true,
    },
    {
      name: 'orCondition',
      type: 'text',
      label: 'Number is greater than 20 OR enableTest is checked',
      required: true,
      condition: (_, siblings) => {
        if (siblings.number && siblings.enableTest) {
          return siblings.number.value > 20 || siblings.enableTest.value === true;
        }

        return false;
      },
    },
    {
      name: 'nestedConditions',
      type: 'text',
      label: 'Number is either greater than 20 AND enableTest is checked, OR number is less than 20 and enableTest is NOT checked',
      condition: (_, siblings) => {
        if (siblings.number && siblings.enableTest) {
          return (siblings.number.value > 20 && siblings.enableTest.value === true) || (siblings.number.value < 20 && siblings.enableTest.value === false);
        }

        return false;
      },
    },
  ],
};

module.exports = Conditions;
