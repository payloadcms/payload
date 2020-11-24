/* eslint-disable @typescript-eslint/no-unused-vars */

import { BeforeOperationHook, BeforeValidateHook, HookOperationType } from './collections/config/types';
import { buildConfig } from './config/build';
import { Field, Block, BlockField, RadioField, ArrayField, RichTextField, GroupField, SelectField, SelectManyField, UploadField, RelationshipField } from './fields/config/types';

const cfg = buildConfig({
  serverURL: 'localhost:3000',
  admin: {
    disable: true,
  },
});

const beforeOpHook: BeforeOperationHook = ({ args, operation }) => {
  if (operation === 'create' && args.req.query && typeof args.req.query.checkout !== 'undefined') {
    return {
      ...args,
      disableVerificationEmail: true,
    };
  }

  return args;
};

const beforeOpHookResult = beforeOpHook({ args: {}, operation: 'create' });

const beforeValidate: BeforeValidateHook = ({ data, req, operation, originalDoc }) => {
  if (operation === 'create') {
    const formattedData = { ...data };
    const { user } = req;
  }
};


const TextField: Field = {
  name: 'text',
  type: 'text',
  label: 'Text',
  required: true,
  defaultValue: 'Default Value',
  unique: true,
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
};

const NumbersBlock: Block = {
  slug: 'number',
  labels: {
    singular: 'Number',
    plural: 'Numbers',
  },
  fields: [
    {
      name: 'testNumber',
      label: 'Test Number Field',
      type: 'number',
      maxLength: 100,
      required: true,
    },
  ],
};

const CTA: Block = {
  slug: 'cta',
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  fields: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      maxLength: 100,
      required: true,
    },
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      height: 100,
      required: true,
    },
  ],
};


const blockField: BlockField = {
  name: 'blocks',
  type: 'blocks',
  label: 'Blocks Content',
  minRows: 2,
  blocks: [NumbersBlock, CTA],
  localized: true,
  required: true,
};

const radioGroup: RadioField = {
  name: 'radioGroupExample',
  label: 'Radio Group Example',
  type: 'radio',
  options: [{
    value: 'option-1',
    label: 'Options 1 Label',
  }, {
    value: 'option-2',
    label: 'Option 2 Label',
  }, {
    value: 'option-3',
    label: 'Option 3 Label',
  }],
  defaultValue: 'option-2',
  required: true,
  admin: {
    readOnly: true,
  },
};

const arrayField: ArrayField = {
  type: 'array',
  label: 'Array',
  name: 'array',
  minRows: 2,
  maxRows: 4,
  fields: [
    // {
    //   type: 'row',
    //   fields: [
    //     {
    //       name: 'arrayText1',
    //       label: 'Array Text 1',
    //       type: 'text',
    //     },
    //     {
    //       name: 'arrayText2',
    //       label: 'Array Text 2',
    //       type: 'text',
    //       required: true,
    //     },
    //   ],
    // },
    {
      type: 'text',
      name: 'arrayText3',
      label: 'Array Text 3',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'checkbox',
      label: 'Checkbox',
      type: 'checkbox',
    },
  ],
};

const richTextField: RichTextField = {
  name: 'richText',
  type: 'richText',
  label: 'Rich Text',
  required: true,
  admin: {
    elements: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'ul',
      'ol',
      'link',
    ],
    leaves: [
      'bold',
      'italic',
      'underline',
      'strikethrough',
    ],
  },
};

const groupField: GroupField = {
  name: 'group',
  label: 'Group',
  type: 'group',
  fields: [
    {
      type: 'text',
      name: 'nestedGroupCustomField',
      label: 'Nested Group Custom Field',
    },
  ],
};
console.log(groupField);

const selectField: SelectField = {
  name: 'select',
  label: 'Select',
  type: 'select',
  options: [{
    value: 'option-1',
    label: 'Option 1 Label',
  }, {
    value: 'option-2',
    label: 'Option 2 Label',
  }, {
    value: 'option-3',
    label: 'Option 3 Label',
  }, {
    value: 'option-4',
    label: 'Option 4 Label',
  }],
  defaultValue: 'option-1',
  required: true,
};

const selectMany: SelectManyField = {
  name: 'selectMany',
  label: 'Select w/ hasMany',
  type: 'select',
  options: [{
    value: 'option-1',
    label: 'Option 1 Label',
  }, {
    value: 'option-2',
    label: 'Option 2 Label',
  }, {
    value: 'option-3',
    label: 'Option 3 Label',
  }, {
    value: 'option-4',
    label: 'Option 4 Label',
  }],
  defaultValue: 'option-1',
  required: true,
  hasMany: true,
};

const upload: UploadField = {
  name: 'image',
  type: 'upload',
  label: 'Image',
  relationTo: 'media',
};

const rel1: RelationshipField = {
  type: 'relationship',
  label: 'Relationship to One Collection',
  name: 'relationship',
  relationTo: 'conditions',
  hasMany: false,
};
const rel2: RelationshipField = {
  type: 'relationship',
  label: 'Relationship hasMany',
  name: 'relationshipHasMany',
  relationTo: ['localized-posts', 'sdf'],
  hasMany: true,
};
