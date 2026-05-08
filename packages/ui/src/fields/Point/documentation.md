# PointField

The `PointField` component is the fully-connected Payload geographic point field. It renders two labelled `<input type="number">` elements — one for longitude and one for latitude — each paired with an `InputStepper` for increment/decrement control. The pair of values is stored as a `[longitude, latitude]` tuple. The component wires directly into the Payload form context via `useField` and handles its own validation, error, and description display.

## Import

```tsx
import { PointField } from '@payloadcms/ui'
```

## Usage

The `PointField` is a fully-connected field component. Use it as a custom field component in your Payload collection config:

```tsx
import { PointField } from '@payloadcms/ui'

// Inside a Payload collection admin config:
{
  name: 'location',
  type: 'point',
  admin: {
    components: {
      Field: PointField,
    },
  },
}
```

## Props

`PointField` implements the `PointFieldClientComponent` contract from Payload. Configuration is drawn from the field config:

| Prop / Admin Config       | Type                                    | Default | Description                                                            |
| ------------------------- | --------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `field.label`             | `string \| Record<string, string>`      | —       | Base label prepended to "Longitude" and "Latitude" sub-labels          |
| `field.required`          | `boolean`                               | —       | Marks both coordinate inputs as required                               |
| `field.admin.step`        | `number`                                | `1`     | Increment/decrement amount for both stepper buttons                    |
| `field.admin.placeholder` | `string \| Record<string, string>`      | —       | Placeholder text for both coordinate inputs; supports i18n locale map  |
| `field.admin.description` | `string \| (() => string) \| ReactNode` | —       | Helper text rendered below the field pair                              |
| `field.admin.className`   | `string`                                | —       | Additional CSS class for the root wrapper                              |
| `readOnly`                | `boolean`                               | —       | Disables both inputs and stepper buttons                               |
| `validate`                | `PointFieldValidation`                  | —       | Custom validation function; receives the `[longitude, latitude]` tuple |
| `path`                    | `string`                                | —       | Field path within the form data tree                                   |

## Stored value format

The field stores and receives values as a two-element tuple: `[longitude, latitude]`. Index `0` is longitude, index `1` is latitude — matching the GeoJSON coordinate order.

## Variants

### Basic location field

```tsx
{
  name: 'storeLocation',
  type: 'point',
  label: 'Store Location',
  admin: {
    description: 'Enter the geographic coordinates of the store.',
  },
}
```

### High-precision coordinates with decimal step

```tsx
{
  name: 'gpsCoordinates',
  type: 'point',
  label: 'GPS Coordinates',
  admin: {
    step: 0.000001,
    placeholder: '0.000000',
    description: 'Six decimal places provide ~0.1 m accuracy.',
  },
}
```

### Required read-only display

```tsx
{
  name: 'originPoint',
  type: 'point',
  label: 'Origin',
  required: true,
  admin: {
    readOnly: true,
    description: 'Set automatically on creation.',
  },
}
```
