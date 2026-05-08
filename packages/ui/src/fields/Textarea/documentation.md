# TextareaInput

The `TextareaInput` component is the presentational layer for the Payload textarea field. It renders a labelled `<textarea>` with optional description, error state, and row-count control. Use this component directly when you need a standalone multi-line text input outside of a Payload form context. The connected form component is `TextareaField`.

## Import

```tsx
import { TextareaInput } from '@payloadcms/ui'
```

## Usage

```tsx
<TextareaInput label="Bio" path="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
```

## Props

| Prop          | Type                                            | Default | Description                                                               |
| ------------- | ----------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `path`        | `string`                                        | —       | **Required.** Field path used as `name` and `id` on the textarea          |
| `label`       | `string \| Record<string, string>`              | —       | Label rendered above the textarea via `FieldLabel`                        |
| `value`       | `string`                                        | —       | Controlled value of the textarea                                          |
| `onChange`    | `(e: ChangeEvent<HTMLTextAreaElement>) => void` | —       | Change handler                                                            |
| `rows`        | `number`                                        | `5`     | Number of visible text rows; sets the CSS `--rows` custom property        |
| `readOnly`    | `boolean`                                       | —       | Disables the textarea when `true`                                         |
| `required`    | `boolean`                                       | —       | Marks the field as required and adds a visual indicator to the label      |
| `placeholder` | `string`                                        | —       | Placeholder text for the textarea                                         |
| `description` | `string \| (() => string) \| ReactNode`         | —       | Helper text rendered below the textarea via `FieldDescription`            |
| `showError`   | `boolean`                                       | —       | When `true`, applies error styling and renders the `FieldError` component |
| `className`   | `string`                                        | —       | Additional CSS class names for the root wrapper                           |
| `localized`   | `boolean`                                       | —       | Shows a localization indicator on the label                               |
| `rtl`         | `boolean`                                       | —       | Sets `data-rtl` on the textarea for right-to-left text direction          |
| `BeforeInput` | `ReactNode`                                     | —       | Slot rendered immediately before the `<textarea>` element                 |
| `AfterInput`  | `ReactNode`                                     | —       | Slot rendered immediately after the `<textarea>` element                  |
| `Label`       | `ReactNode`                                     | —       | Custom label component; overrides the default `FieldLabel`                |
| `Error`       | `ReactNode`                                     | —       | Custom error component; overrides the default `FieldError`                |
| `Description` | `ReactNode`                                     | —       | Custom description component; overrides the default `FieldDescription`    |
| `style`       | `React.CSSProperties`                           | —       | Inline styles applied to the root wrapper                                 |

## Variants

### Expanded textarea with description

```tsx
<TextareaInput
  description="Supports plain text only. Maximum 500 characters."
  label="Product Description"
  path="description"
  rows={8}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Read-only display

```tsx
<TextareaInput label="System Notes" path="systemNotes" readOnly rows={4} value={systemNotes} />
```

### Error state

```tsx
<TextareaInput
  label="Terms Agreement"
  path="terms"
  required
  showError
  value={terms}
  onChange={(e) => setTerms(e.target.value)}
/>
```
