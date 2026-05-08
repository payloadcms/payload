# CheckboxInput

The `CheckboxInput` component is the presentational layer for the Payload checkbox field. It renders a styled checkbox with a custom check/indeterminate icon, an associated label, and optional slots for content before and after the input. Use this component directly when you need a standalone checkbox outside of a Payload form context. The connected form component is `CheckboxField`.

## Import

```tsx
import { CheckboxInput } from '@payloadcms/ui'
```

## Usage

```tsx
<CheckboxInput
  checked={isActive}
  label="Active"
  name="active"
  onToggle={(e) => setIsActive(e.target.checked)}
/>
```

## Props

| Prop             | Type                                                   | Default | Description                                                                        |
| ---------------- | ------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------- |
| `onToggle`       | `(event: React.ChangeEvent<HTMLInputElement>) => void` | —       | **Required.** Called when the checkbox state changes                               |
| `checked`        | `boolean`                                              | —       | Whether the checkbox is checked                                                    |
| `partialChecked` | `boolean`                                              | —       | When `true` and `checked` is `false`, renders the indeterminate (`LineIcon`) state |
| `label`          | `string \| Record<string, string>`                     | —       | Label text rendered next to the checkbox via `FieldLabel`                          |
| `name`           | `string`                                               | —       | Native `name` attribute; also used for `aria-labelledby` and `title`               |
| `id`             | `string`                                               | —       | Native `id` for the `<input>`; auto-generated via `useId` if omitted               |
| `readOnly`       | `boolean`                                              | —       | Disables the checkbox; also forced `true` before client hydration                  |
| `required`       | `boolean`                                              | —       | Marks the field as required                                                        |
| `localized`      | `boolean`                                              | —       | Shows a localization indicator on the label                                        |
| `className`      | `string`                                               | —       | Additional CSS class names for the root wrapper                                    |
| `inputRef`       | `React.RefObject<HTMLInputElement \| null>`            | —       | Ref forwarded to the underlying `<input>` element                                  |
| `BeforeInput`    | `ReactNode`                                            | —       | Slot rendered before the checkbox input group                                      |
| `AfterInput`     | `ReactNode`                                            | —       | Slot rendered after the checkbox input group                                       |
| `Label`          | `ReactNode`                                            | —       | Custom label component; overrides the default `FieldLabel`                         |
| `Error`          | `ReactNode`                                            | —       | Custom error component rendered inside the input group                             |

## Variants

### Basic controlled checkbox

```tsx
const [accepted, setAccepted] = React.useState(false)

<CheckboxInput
  checked={accepted}
  label="I accept the terms and conditions"
  name="acceptTerms"
  required
  onToggle={(e) => setAccepted(e.target.checked)}
/>
```

### Indeterminate (partial) state

Used for "select all" controls where only some child items are selected:

```tsx
<CheckboxInput
  checked={false}
  label="Select all"
  name="selectAll"
  partialChecked={someSelected}
  onToggle={handleSelectAll}
/>
```

### Read-only display

```tsx
<CheckboxInput
  checked
  label="Email notifications enabled"
  name="emailNotifications"
  readOnly
  onToggle={() => {}}
/>
```
