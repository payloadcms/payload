# Breadcrumbs

This plugin extends Payload collections with a parent -> child hierarchy as well as dynamically populates "breadcrumbs".

### Example Installation

```js
import { buildConfig } from 'payload/config';
import breadcrumbs from '@payloadcms/plugin-breadcrumbs';
import Pages from './collections/Pages';

export default buildConfig({
  serverURL: 'https://localhost:3000',
  collections: [
    Pages,
  ],
  plugins: [
    breadcrumbs({
      collections: ['pages'],
      generateURL: (parentBreadcrumbs, currentDoc) => {
        // This example shows how to combine breadcrumb URLs to create full
        // URL paths like /about/company/our-team

        // Reduce the parent breadcrumbs into a string
        // Initialize the reducer's accumulator as the current doc's slug
        return parentBreadcrumbs.reduce(
          (url, breadcrumb) => {
            // Join paths together
            return `${breadcrumb.url}${url}`;
          },
          `/${currentDoc.slug}`
        );
      }
      ,
    }),
    }),
  ],
})
```

## How it works

This plugin adds two new fields to all collections that you specify:

### `parent`

The `parent` field is a `relationship` that allows for editors to choose a parent document from the same collection, which acts as the document's direct parent.

### `breadcrumbs`

The `breadcrumbs` field is an `array` which dynamically populates all parent relationships of a document up to the top level. It does not store any data in the database, and instead, acts as a `virtual` field which is dynamically populated each time the document is loaded.

The `breadcrumbs` array stores the following fields:

**`label`**

The label of the breadcrumb. This field is automatically set to either the `collection.admin.useAsTitle` (if defined) or is set to the `ID` of the document. You can also dynamically define the `label` by passing a function to the options property of `generateLabel`. More detail is below.

**`url`**

The URL of the breadcrumb. By default, this field is undefined. You can manually define this field by passing a property called function to the plugin options property of `generateURL`.

## Options

| Option                     | Description |
| -------------------------- | ----------- |
| **`collections`** *        | An array of collection slugs of which you want to enable breadcrumbs on. |
| **`generateURL`**          | A function that allows you to dynamically generate a URL for each breadcrumb. |
| **`generateLabel`**        | A function that allows you to dynamically generate a label for each breadcrumb. |
| **`parentFieldSlug`**      | If defined, the plugin will assume that you are providing your own parent field, equal to this slug, into each collection where breadcrumbs is enabled. |
| **`breadcrumbsFieldSlug`** | If defined, the plugin will assume that you are providing your own breadcrumbs field, equal to this slug, into each collection where breadcrumbs is enabled. |

*\* An asterisk denotes that a property is required.*

##### `generateLabel`

Each `breadcrumb` has a required `label` field. By default, its value will be set to the collection's `admin.useAsTitle` field data, and if that data is not defined, the field will be set to the `ID` of the document. However, you can pass a function to this option that allows you to dynamically set the `label` of your breadcrumb.

The function takes two arguments:

1. `breadcrumbs` - an array of the breadcrumbs up to that point
1. `currentDoc` - the current document being edited

The function should return a string.

##### `generateURL`

As with a label, each `breadcrumb` has an optional `url` field. By default, its value will be undefined, but you can pass a function to this option that allows you to dynamically set the `url` of your breadcrumb. For example, you might want to format a full URL containing all breadcrumbs up to that point, say, like `/about-us/company/our-team`. Logic to combine breadcrumbs into a full URL can go here.

The function also takes two arguments:

1. `breadcrumbs` - an array of the breadcrumbs up to that point
1. `currentDoc` - the current document being edited

The function should return a string.

##### `parentFieldSlug`

You can opt out of having the `parent` field provided for you, and instead, provide it yourself to each collection that enables breadcrumbs. This gives you complete control over where you put the field in your admin dashboard, among other customizations. If you pass this property the `name` of your manually provided `parent` field, the plugin will opt-out of automatically providing this field for you and refer to your field instead.

##### `breadcrumbsFieldSlug`

As with the above option, you can also opt out of having the `breadcrumbs` field provided for you by providing your own field, and then passing its `name` to this property.

> Note - if you opt out of automatically being provided a `parent` or `breadcrumbs` field, you need to make sure that both fields are placed at the top-level of your document. They cannot exist within any nested data structures like a `group`, `array`, or `blocks`.

**Tip: You can also leverage and extend the built-in `parent` and `breadcrumb` fields by importing helper methods as follows:**

```js
import { CollectionConfig } from 'payload/types';
import createParentField from '@payloadcms/plugin-breadcrumbs/fields/parent';
import createBreadcrumbsField from '@payloadcms/plugin-breadcrumbs/fields/breadcrumbs';

const examplePageConfig: CollectionConfig = {
  slug: 'pages',
  fields: [
    createParentField(
      // First argument is equal to the slug of the collection
      // that the field references
      'pages',

      // Second argument is equal to field overrides that you specify,
      // which will be merged into the base parent field config
      {
        admin: {
          position: 'sidebar',
        },
      },
    ),
    createBreadcrumbsField(
      // First argument is equal to the slug of the collection
      // that the field references
      'pages',

      // Argument equal to field overrides that you specify,
      // which will be merged into the base `breadcrumbs` field config
      {
        label: 'Page Breadcrumbs',
      }
    )
  ]
}
```
