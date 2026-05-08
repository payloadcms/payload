# NumberField

The `NumberField` component is the fully-connected Payload number field. It renders a labelled `<input type="number">` accompanied by `InputStepper` increment/decrement buttons, and wires directly into the Payload form context via `useField`. The field enforces optional `min`, `max`, and `step` constraints, supports a `hasMany` tag mode for entering multiple numeric values, and handles its own validation, error, and description display.

## Import

```tsx
import { NumberField } from '@payloadcms/ui'
```

## Usage

The `NumberField` is a fully-connected field component. Use it as a custom field component in your Payload collection config:

```tsx
import { NumberField } from '@payloadcms/ui'

// Inside a Payload collection admin config:
{
  name: 'price',
  type: 'number',
  admin: {
    components: {
      Field: NumberField,
    },
  },
}
```

## Props

`NumberField` implements the `NumberFieldClientComponent` contract from Payload. Configuration is drawn from the field config:

| Prop / Admin Config       | Type                                    | Default     | Description                                                         |
| ------------------------- | --------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `field.label`             | `string \| Record<string, string>`      | —           | Label rendered above the input                                      |
| `field.required`          | `boolean`                               | —           | Marks the field as required                                         |
| `field.min`               | `number`                                | `-Infinity` | Minimum allowed value; clamps stepper and validates                 |
| `field.max`               | `number`                                | `Infinity`  | Maximum allowed value; clamps stepper and validates                 |
| `field.hasMany`           | `boolean`                               | `false`     | Enables multi-value tag mode via `ReactSelect`                      |
| `field.maxRows`           | `number`                                | `Infinity`  | Maximum number of values when `hasMany` is `true`                   |
| `field.admin.step`        | `number`                                | `1`         | Increment/decrement amount used by the stepper and the native input |
| `field.admin.placeholder` | `string \| Record<string, string>`      | —           | Placeholder text; supports i18n locale map                          |
| `field.admin.description` | `string \| (() => string) \| ReactNode` | —           | Helper text rendered below the field                                |
| `field.admin.className`   | `string`                                | —           | Additional CSS class for the root wrapper                           |
| `readOnly`                | `boolean`                               | —           | Disables both the input and the stepper buttons                     |
| `validate`                | `function`                              | —           | Custom validation function                                          |
| `onChange`                | `(value: number) => void`               | —           | Optional external change callback                                   |
| `path`                    | `string`                                | —           | Field path within the form data tree                                |

## Variants

### Integer quantity with min/max bounds

```tsx
{
  name: 'quantity',
  type: 'number',
  label: 'Quantity',
  min: 0,
  max: 999,
  admin: {
    step: 1,
    description: 'Available stock for this product.',
  },
}
```

### Decimal step for pricing

```tsx
{
  name: 'price',
  type: 'number',
  label: 'Price (USD)',
  min: 0,
  admin: {
    step: 0.01,
    placeholder: '0.00',
    description: 'Enter the price in US dollars.',
  },
}
```

### Multi-value numeric tags

```tsx
{
  name: 'ratings',
  type: 'number',
  label: 'Ratings',
  hasMany: true,
  maxRows: 5,
  min: 1,
  max: 5,
  admin: {
    description: 'Enter up to 5 rating values between 1 and 5.',
  },
}
```
