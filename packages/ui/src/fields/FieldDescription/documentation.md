# FieldDescription

The `FieldDescription` component renders helper text below (or above) a form field. It is purely presentational and stateless — it renders nothing when `description` is falsy. Labels are resolved through `getTranslation` so the `description` prop accepts plain strings, i18n locale maps, and translation functions equally. All Payload field components use `FieldDescription` internally; use it directly when building custom fields or standalone form elements.

## Import

```tsx
import { FieldDescription } from '@payloadcms/ui'
```

## Usage

```tsx
<FieldDescription description="This value is visible to all users." path="username" />
```

## Props

| Prop              | Type                                    | Default | Description                                                                        |
| ----------------- | --------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `description`     | `string \| (() => string) \| ReactNode` | —       | The description content to render. Nothing is rendered when this is falsy.         |
| `path`            | `string`                                | —       | Field path; appended to the class name as `field-description-{path}` for targeting |
| `className`       | `string`                                | —       | Additional CSS class names for the root `<div>`                                    |
| `marginPlacement` | `'above' \| 'below'`                    | —       | Adds a `field-description--margin-above` or `--margin-below` modifier class        |

## Variants

### Plain string description

```tsx
<FieldDescription description="Enter the full URL including https://." path="websiteUrl" />
```

### Description rendered above the field

```tsx
<FieldDescription
  description="Required for billing purposes."
  marginPlacement="above"
  path="taxId"
/>
```

### i18n locale map description

```tsx
<FieldDescription
  description={{
    en: 'Used as the URL-safe identifier.',
    fr: 'Utilisé comme identifiant sûr pour les URL.',
  }}
  path="slug"
/>
```
