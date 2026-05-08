# SelectInput

The `SelectInput` component is the presentational layer for the Payload select field. It renders a labelled dropdown or multi-select backed by `ReactSelect`, with optional description and error state. Use this component directly for a standalone select outside of a Payload form context. The connected form component is `SelectField`.

## Import

```tsx
import { SelectInput } from '@payloadcms/ui'
```

## Usage

```tsx
<SelectInput
  label="Status"
  name="status"
  options={[
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ]}
  path="status"
  value={status}
  onChange={(selected) => setStatus((selected as { value: string }).value)}
/>
```

## Props

| Prop            | Type                                                           | Default | Description                                                               |
| --------------- | -------------------------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `name`          | `string`                                                       | —       | **Required.** Native `name` passed through for form serialisation         |
| `path`          | `string`                                                       | —       | **Required.** Field path used to generate the wrapper `id`                |
| `options`       | `{ label: string \| Record<string, string>; value: string }[]` | —       | Array of selectable options; labels support i18n locale maps              |
| `value`         | `string \| string[]`                                           | —       | Controlled selected value(s)                                              |
| `onChange`      | `ReactSelectAdapterProps['onChange']`                          | —       | Called with the full react-select option object(s) on selection change    |
| `label`         | `string \| Record<string, string>`                             | —       | Label rendered above the select via `FieldLabel`                          |
| `hasMany`       | `boolean`                                                      | `false` | Enables multi-select mode                                                 |
| `isClearable`   | `boolean`                                                      | `true`  | Shows a clear button to reset the selection                               |
| `isSortable`    | `boolean`                                                      | `true`  | Allows drag-to-reorder selected values in multi-select mode               |
| `readOnly`      | `boolean`                                                      | —       | Disables the select                                                       |
| `required`      | `boolean`                                                      | —       | Marks the field as required and adds a visual indicator to the label      |
| `placeholder`   | `string \| (() => string)`                                     | —       | Placeholder text when no option is selected                               |
| `description`   | `string \| (() => string) \| ReactNode`                        | —       | Helper text rendered below the field via `FieldDescription`               |
| `showError`     | `boolean`                                                      | —       | When `true`, applies error styling and renders the `FieldError` component |
| `localized`     | `boolean`                                                      | —       | Shows a localization indicator on the label                               |
| `className`     | `string`                                                       | —       | Additional CSS class names for the root wrapper                           |
| `id`            | `string`                                                       | —       | Additional `id` passed to the underlying `ReactSelect` instance           |
| `filterOption`  | `ReactSelectAdapterProps['filterOption']`                      | —       | Custom option filter function                                             |
| `onInputChange` | `ReactSelectAdapterProps['onInputChange']`                     | —       | Called when the text in the search input changes                          |
| `BeforeInput`   | `ReactNode`                                                    | —       | Slot rendered before the `ReactSelect` element                            |
| `AfterInput`    | `ReactNode`                                                    | —       | Slot rendered after the `ReactSelect` element                             |
| `Label`         | `ReactNode`                                                    | —       | Custom label component; overrides the default `FieldLabel`                |
| `Error`         | `ReactNode`                                                    | —       | Custom error component; overrides the default `FieldError`                |
| `Description`   | `ReactNode`                                                    | —       | Custom description component; overrides the default `FieldDescription`    |
| `style`         | `React.CSSProperties`                                          | —       | Inline styles applied to the root wrapper                                 |

## Variants

### Single-select with placeholder

```tsx
<SelectInput
  label="Category"
  name="category"
  options={[
    { label: 'Technology', value: 'tech' },
    { label: 'Design', value: 'design' },
    { label: 'Business', value: 'business' },
  ]}
  path="category"
  placeholder="Select a category..."
  value={category}
  onChange={(selected) => setCategory((selected as { value: string }).value)}
/>
```

### Multi-select with description

```tsx
<SelectInput
  description="Choose all tags that apply to this post."
  hasMany
  isClearable={false}
  label="Tags"
  name="tags"
  options={[
    { label: 'Featured', value: 'featured' },
    { label: 'Tutorial', value: 'tutorial' },
    { label: 'News', value: 'news' },
  ]}
  path="tags"
  value={tags}
  onChange={(selected) => setTags((selected as { value: string }[]).map((opt) => opt.value))}
/>
```

### Read-only select

```tsx
<SelectInput
  label="Approval Status"
  name="approvalStatus"
  options={[
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]}
  path="approvalStatus"
  readOnly
  value="approved"
  onChange={() => {}}
/>
```
