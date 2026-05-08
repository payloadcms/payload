# TextInput

The `TextInput` component is the presentational layer for the Payload text field. It renders a labelled single-line `<input type="text">` with optional description, error state, and slot nodes for custom content before and after the input. Use this component directly when you need a standalone, uncontrolled text input outside of a Payload form context.

## Import

```tsx
import { TextInput } from '@payloadcms/ui'
```

## Usage

```tsx
<TextInput label="Title" path="title" value={value} onChange={(e) => setValue(e.target.value)} />
```

## Props

| Prop          | Type                                         | Default | Description                                                                  |
| ------------- | -------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `path`        | `string`                                     | —       | **Required.** Field path used as the `name` and `id` attributes on the input |
| `label`       | `string \| Record<string, string>`           | —       | Field label rendered above the input via `FieldLabel`                        |
| `value`       | `string`                                     | —       | Controlled value of the input                                                |
| `onChange`    | `(e: ChangeEvent<HTMLInputElement>) => void` | —       | Change handler for single-value mode                                         |
| `readOnly`    | `boolean`                                    | —       | Disables the input when `true`                                               |
| `required`    | `boolean`                                    | —       | Marks the field as required and adds a visual indicator to the label         |
| `placeholder` | `string \| Record<string, string>`           | —       | Placeholder text; supports i18n locale map                                   |
| `description` | `string \| (() => string) \| ReactNode`      | —       | Helper text rendered below the input via `FieldDescription`                  |
| `showError`   | `boolean`                                    | —       | When `true`, applies error styling and renders the `FieldError` component    |
| `className`   | `string`                                     | —       | Additional CSS class names for the root wrapper                              |
| `localized`   | `boolean`                                    | —       | Shows a localization indicator on the label                                  |
| `rtl`         | `boolean`                                    | —       | Sets `data-rtl` on the input to enable right-to-left text direction          |
| `hasMany`     | `boolean`                                    | —       | Switches to multi-value tag mode backed by `ReactSelect`                     |
| `maxRows`     | `number`                                     | —       | Maximum number of tags when `hasMany` is `true`                              |
| `BeforeInput` | `ReactNode`                                  | —       | Slot rendered immediately before the `<input>` element                       |
| `AfterInput`  | `ReactNode`                                  | —       | Slot rendered immediately after the `<input>` element                        |
| `Label`       | `ReactNode`                                  | —       | Custom label component; overrides the default `FieldLabel`                   |
| `Error`       | `ReactNode`                                  | —       | Custom error component; overrides the default `FieldError`                   |
| `Description` | `ReactNode`                                  | —       | Custom description component; overrides the default `FieldDescription`       |
| `inputRef`    | `React.RefObject<HTMLInputElement>`          | —       | Ref forwarded to the underlying `<input>` element                            |
| `style`       | `React.CSSProperties`                        | —       | Inline styles applied to the root wrapper                                    |

## Variants

### Required field with description

```tsx
<TextInput
  description="Used as the page title in search results."
  label="SEO Title"
  path="seoTitle"
  required
  value={seoTitle}
  onChange={(e) => setSeoTitle(e.target.value)}
/>
```

### Read-only display

```tsx
<TextInput label="Slug" path="slug" readOnly value="my-document-slug" />
```

### Field in error state

```tsx
<TextInput
  label="Username"
  path="username"
  showError
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```
