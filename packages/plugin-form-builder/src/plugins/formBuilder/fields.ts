import { Block, Field } from 'payload/types';

const name: Field = {
  name: 'name',
  label: 'Name (lowercase, no special characters)',
  type: 'text',
  required: true,
};

const label: Field = {
  name: 'label',
  label: 'Label',
  type: 'text',
  required: true,
};

const required: Field = {
  name: 'required',
  label: 'Required',
  type: 'checkbox',
};

const width: Field = {
  name: 'width',
  label: 'Field Width (percentage)',
  type: 'number',
};

const Select: Block = {
  slug: 'select',
  labels: {
    singular: 'Select',
    plural: 'Select Fields',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          label: 'Default Value',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'options',
      label: 'Select Attribute Options',
      type: 'array',
      labels: {
        singular: 'Option',
        plural: 'Options',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              label: 'Label',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'value',
              label: 'Value',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
          ],
        },
      ],
    },
    required,
  ],
};

const Text: Block = {
  slug: 'text',
  labels: {
    singular: 'Text',
    plural: 'Text Fields',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          label: 'Default Value',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    required,
  ],
};

const Email: Block = {
  slug: 'email',
  labels: {
    singular: 'Email',
    plural: 'Email Fields',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    width,
    required,
  ],
};

const State: Block = {
  slug: 'state',
  labels: {
    singular: 'State',
    plural: 'State Fields',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'countryFieldName',
      label: 'Country Field Name',
      type: 'text',
      required: true,
    },
    width,
    required,
  ],
};

const Country: Block = {
  slug: 'country',
  labels: {
    singular: 'Country',
    plural: 'Country Fields',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'stateFieldName',
      label: 'State Field Name',
      type: 'text',
      required: true,
    },
    width,
    required,
  ],
};

const Checkbox: Block = {
  slug: 'checkbox',
  labels: {
    singular: 'Checkbox',
    plural: 'Checkbox Fields',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          ...required,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'defaultValue',
      label: 'Default Value',
      type: 'checkbox',
    },
  ],
};

const Message: Block = {
  slug: 'message',
  labels: {
    singular: 'Message',
    plural: 'Message Blocks',
  },
  fields: [
    {
      name: 'message',
      type: 'textarea',
    },
  ],
};

export default {
  select: Select,
  checkbox: Checkbox,
  text: Text,
  email: Email,
  message: Message,
  country: Country,
  state: State,
};
