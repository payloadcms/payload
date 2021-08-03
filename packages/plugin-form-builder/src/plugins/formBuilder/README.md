# Form Builder

This plugin adds full, headless, form-building functionality to Payload CMS.

### Example Installation

```js
import { buildConfig } from 'payload/config';
import payloadFormBuilder from '@payloadcms/plugin-form-builder';

export default buildConfig({
  serverURL: 'https://localhost:3000',
  plugins: [
    payloadFormBuilder({
      fields: [
        'text',
        'select',
        'checkbox',

        // Custom field example
        {
          block: {
            slug: 'CustomField',
            fields: [
              {
                name: 'name',
                type: 'text',
              },
              {
                name: 'label',
                type: 'text',
              },
            ],
          },
          validate: (value) => {
            if (value === 'what we want it to be') return true;

            // Otherwise, this field data is invalid.
            return 'This field is incorrect'.
          }
        },
      ],
    }),
  ],
})
```

## How it works

This plugin injects two new collections:

### Forms

Forms provide a form-building mechanism where your admins can self-build forms to suit their use cases. The Forms collection provides a `blocks` field type that contains a variety of built-in fields, including:

- Typical text field
- Select field that offers specific options
- Email that validates an incoming email address
- Checkbox
- State (US-based list of states)
- Country (Common country list)

### Form Submissions

Form Submissions validate incoming form submissions and track them over time right in Payload.

## Options

| Option               | Description |
| -------------------- | ----------- |
| **`fields`**         | An array of field slugs or custom field definitions which define the fields you allow your admin editors to build forms with. [More](#specifying-field-types) |
| **`formsOverrides`** | Provide any overrides that you need to the `Forms` collection config. They will be merged in to the injected `Forms` collection. |
| **`formSubmissionsOverrides`** | Provide any overrides that you need to the `Form Submissions` collection config. They will be merged in to the injected `Form Submissions` collection. |

*\* An asterisk denotes that a property is required.*

#### Specifying field types

You can specify which fields you want to use, as well as inject your own custom fields.

##### Custom fields

You can also provide your own custom field definitions. A custom field is simply a [Payload block definition](https://payloadcms.com/docs/fields/blocks#block-configs) - nothing more. To define a custom field, pass an object into the `fields` option with the following properties:

| Property         | Description |
| ---------------- | ----------- |
| **`block`** *    | A Payload block config that defines the fields that will be presented to your admin user if they choose to use this field. |
| **`validate`**   | An optional validation function to use when data for this field is received. Return either `true` or a `string` equal to an appropriate error message. |

*\* An asterisk denotes that a property is required.*

## Default Access Control

By default, this plugin relies on the default Payload access control function for all collection access control, except the `Form Submissions` `create` and `update` operations. This is because anyone should be able to create a form submission, even from a public-facing website - but no one should be able to update a submission one it has been created.

If this is not suitable for your use case, you can override access control of both `Forms` and `Form Submissions` by passing in overrides for either collection config.
