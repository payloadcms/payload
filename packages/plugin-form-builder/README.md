# Payload Form Builder Plugin

[![NPM](https://img.shields.io/npm/v/@payloadcms/plugin-form-builder)](https://www.npmjs.com/package/@payloadcms/plugin-form-builder)

A plugin for [Payload CMS](https://github.com/payloadcms/payload) to easily allow your admin editors to build and manage forms from the admin panel.

Core features:
  - Creates a `forms` collection where you can:
    - Build dynamic forms with any number of fields
    - Add payment fields that can handle dynamic prices
    - Build completely custom and dynamic emails
  - Creates a `formSubmissions` collection that:
    - Validates and saves the form data submitted by your frontend
    - Sends emails (if applicable)
    - Handles payment processing (if applicable)

## Installation

```bash
  yarn add @payloadcms/plugin-form-builder
  # OR
  npm i @payloadcms/plugin-form-builder
```

## Basic Usage

In the  `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from 'payload/config';
import formBuilder from '@payloadcms/plugin-form-builder';

const config = buildConfig({
  collections: [
    {
      slug: 'pages',
      fields: []
    }
  ],
  plugins: [
    formBuilder()
  ]
});

export default config;
```

### Options

- `fields`
    An object of field types to allow your admin editors to build forms with. Pass either a boolean value or a partial [Payload Block](https://payloadcms.com/docs/fields/blocks#block-configs) to override default settings. See [Fields](#fields) for more details.

    ```
    fields: {
      text: true,
      textarea: true,
      select: true,
      email: true,
      state: true,
      country: true,
      checkbox: true,
      number: true,
      message: true,
      payment: false
    }
    ```

    You can also provide your own custom field definitions by passing a new [Payload Block](https://payloadcms.com/docs/fields/blocks#block-configs) object into `fields`.


- `redirectRelationships`

    An array of collection slugs that, when enabled, are populated as options in form redirect fields.

    ```
    redirectRelationships: ['pages']
    ```

- `handlePayment`

   A [beforeChange]([beforeChange](https://payloadcms.com/docs/hooks/globals#beforechange)) hook that is called upon form submissions. You can integrate into any third-party payment processing API here. There is a `getPaymentTotal` function that will calculate the total cost after all conditions have been applied.

    ```
    import { getPaymentTotal } from '@payloadcms/plugin-form-builder';
    ...
    handlePayment: async ({ form, submissionData }) => {
      // first calculate the price
      const paymentField =  form.fields?.find((field) => field.blockType === 'payment');
      const price = getPaymentTotal({
        basePrice: paymentField.basePrice,
        priceConditions: paymentField.priceConditions,
        fieldValues: submissionData,
      });
      // then asynchronously process the payment here
    }
    ```

- `beforeEmail`

    A [beforeChange]([beforeChange](https://payloadcms.com/docs/hooks/globals#beforechange)) hook that is called just after emails are prepared, but before they are sent. This is a great place to inject your own HTML template to add custom styles.

    ```
    beforeEmails: (emailsToSend) => {
      // modify the emails in any way before they are sent
      return emails.map((email) => ({
        ...email,
        html: email.html // transform the html in any way you'd like (maybe wrap it in an html template?)
      }))
    };
    ```

- `formOverrides`

    Override anything on the form collection by sending a [Payload Collection Config](https://payloadcms.com/docs/configuration/collections). Your overrides will be merged into the default `forms` collection.

    ```
    formOverrides: {
      slug: 'contact-forms'
    }
    ```

- `formSubmissionOverrides`
    By default, this plugin relies on [Payload access control](https://payloadcms.com/docs/access-control/collections) to restrict the `update` and `read` operations. This is because anyone should be able to create a form submission, even from a public-facing website - but no one should be able to update a submission one it has been created, or read a submission unless they have permission.

    You can override access control and anything else on the form submission collection by sending a [Payload Collection Config](https://payloadcms.com/docs/configuration/collections). Your overrides will be merged into the default `formSubmissions` collection.

    ```
    formSubmissionOverrides: {
      slug: 'leads'
    }
    ```

## Fields

Each form field is defined as a [Payload Block](https://payloadcms.com/docs/fields/blocks) with the following subfields:

  - Text
    - `name`: string
    - `label`: string
    - `defaultValue`: string
    - `width`: string
    - `required`: checkbox
  - Textarea
    - `name`: string
    - `label`: string
    - `defaultValue`: string
    - `width`: string
    - `required`: checkbox
  - Select
    - `name`: string
    - `label`: string
    - `defaultValue`: string
    - `width`: string
    - `options`: array
    - `required`: checkbox
  - Email
    - `name`: string
    - `label`: string
    - `defaultValue`: string
    - `width`: string
    - `required`: checkbox
  - State
    - `name`: string
    - `label`: string
    - `defaultValue`: string
    - `width`: string
    - `required`: checkbox
  - Country
    - `name`: string
    - `label`: string
    - `defaultValue`: string
    - `width`: string
    - `required`: checkbox
  - Checkbox
    - `name`: string
    - `label`: string
    - `defaultValue`: checkbox
    - `width`: string
    - `required`: checkbox
  - Number
    - `name`: string
    - `label`: string
    - `defaultValue`: number
    - `width`: string
    - `required`: checkbox
  - Message
    - `message`: richText
  - Payment
    - `name`: string
    - `label`: string
    - `defaultValue`: number
    - `width`: string
    - `required`: checkbox
    - `priceConditions`: array
        - `fieldToUse`: relationship, dynamically populated based on the fields in your form
        - `condition`: string - `equals`, `notEquals` | `hasValue`
        - `valueForOperator`: string - only if `condition` is `equals` or `notEquals`
        - `operator`: string - `add`, `subtract`, `multiply`, `divide`
        - `valueType`: string - `static`, `valueOfField`
        - `value`: string - only if `valueType` is `static`

  ## Email

  This plugin relies on the [email configuration](https://payloadcms.com/docs/email/overview) defined in your `payload.init()`. It will read from your config and attempt to send your emails using the credentials provided.

  ## TypeScript

  All types can be directly imported:
  ```js
  import {
    FormConfig,
    Form,
    FormSubmission,
    FieldsConfig,
    BeforePayment,
    HandlePayment
   } from '@payloadcms/plugin-form-builder/dist/types';
  ```

  ## Screenshots

  ![screenshot 1](https://github.com/payloadcms/plugin-form-builder/blob/main/images/screenshot-1.jpg?raw=true)
  ![screenshot 2](https://github.com/payloadcms/plugin-form-builder/blob/main/images/screenshot-2.jpg?raw=true)
  ![screenshot 3](https://github.com/payloadcms/plugin-form-builder/blob/main/images/screenshot-3.jpg?raw=true)
  ![screenshot 4](https://github.com/payloadcms/plugin-form-builder/blob/main/images/screenshot-4.jpg?raw=true)
  ![screenshot 5](https://github.com/payloadcms/plugin-form-builder/blob/main/images/screenshot-5.jpg?raw=true)
  ![screenshot 6](https://github.com/payloadcms/plugin-form-builder/blob/main/images/screenshot-6.jpg?raw=true)
