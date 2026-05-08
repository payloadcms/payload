# EmailField

The `EmailField` component is the full Payload email field, wired up to the form context via `useField`. It renders a labelled `<input type="email">` with the `.field-type.email` wrapper and `.form-input` CSS classes. The field handles its own validation, error display, and description — making it suitable for use inside any Payload admin form.

For a standalone presentational email input outside of a Payload form, render the HTML `<input type="email" className="form-input">` directly instead.

## Import

```tsx
import { EmailField } from '@payloadcms/ui'
```

## Usage

The `EmailField` is a fully-connected field component and receives its configuration from the Payload form context. You pass it as a custom field component in your collection config:

```tsx
import { EmailField } from '@payloadcms/ui'

// Inside a Payload collection admin config:
{
  name: 'contactEmail',
  type: 'email',
  admin: {
    components: {
      Field: EmailField,
    },
  },
}
```

## Props

`EmailField` implements the `EmailFieldClientComponent` contract from Payload. The relevant admin-level options are drawn from the field config:

| Prop / Admin Config        | Type                                    | Default | Description                                                |
| -------------------------- | --------------------------------------- | ------- | ---------------------------------------------------------- |
| `field.label`              | `string \| Record<string, string>`      | —       | Label rendered above the input                             |
| `field.required`           | `boolean`                               | —       | Marks the field as required                                |
| `field.admin.placeholder`  | `string \| Record<string, string>`      | —       | Placeholder text; supports i18n locale map                 |
| `field.admin.description`  | `string \| (() => string) \| ReactNode` | —       | Helper text rendered below the field                       |
| `field.admin.autoComplete` | `string`                                | —       | Native `autocomplete` attribute forwarded to the `<input>` |
| `field.admin.className`    | `string`                                | —       | Additional CSS class for the root wrapper                  |
| `readOnly`                 | `boolean`                               | —       | Disables the input                                         |
| `validate`                 | `EmailFieldValidation`                  | —       | Custom validation function                                 |
| `path`                     | `string`                                | —       | Field path within the form data tree                       |

## Variants

### Basic email field config

```tsx
{
  name: 'email',
  type: 'email',
  label: 'Email Address',
  required: true,
  admin: {
    placeholder: 'user@example.com',
    description: 'We will never share your email with third parties.',
    autoComplete: 'email',
  },
}
```

### Read-only email field

```tsx
{
  name: 'primaryEmail',
  type: 'email',
  label: 'Primary Email',
  admin: {
    readOnly: true,
    description: 'Contact support to change your primary email address.',
  },
}
```

### Email field with custom validation

```tsx
import type { EmailFieldValidation } from 'payload'

const corporateEmailOnly: EmailFieldValidation = (value) => {
  if (value && !value.endsWith('@company.com')) {
    return 'Only corporate email addresses are allowed.'
  }
  return true
}

{
  name: 'workEmail',
  type: 'email',
  label: 'Work Email',
  validate: corporateEmailOnly,
}
```
