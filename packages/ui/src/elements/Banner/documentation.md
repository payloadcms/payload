# Banner

The Banner component displays contextual notification messages in the Payload admin panel. It supports four semantic type variants (default, info, success, error), an optional icon with configurable alignment, and can function as a plain container, a clickable button, or a navigable link depending on which props are provided.

## Import

```tsx
import { Banner } from '@payloadcms/ui'
```

## Usage

```tsx
<Banner type="info">Your changes have been saved as a draft.</Banner>
```

## Props

| Prop        | Type                                          | Default     | Description                                                                   |
| ----------- | --------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `type`      | `'default' \| 'info' \| 'success' \| 'error'` | `'default'` | Controls the color and semantic intent of the banner                          |
| `children`  | `ReactNode`                                   | —           | Content rendered inside the banner                                            |
| `icon`      | `ReactNode`                                   | —           | Optional icon element rendered alongside the content                          |
| `alignIcon` | `'left' \| 'right'`                           | `'right'`   | Side of the banner where the icon is placed (only applies when `icon` is set) |
| `to`        | `string`                                      | —           | When provided, renders the banner as a `<Link>` navigating to this path       |
| `onClick`   | `MouseEventHandler`                           | —           | When provided (without `to`), renders the banner as a `<button>`              |
| `className` | `string`                                      | —           | Additional CSS class names appended to the root element                       |

## Variants

### Success banner

```tsx
<Banner type="success">Document published successfully.</Banner>
```

### Error banner with left-aligned icon

```tsx
import { XIcon } from '@payloadcms/ui'

;<Banner alignIcon="left" icon={<XIcon />} type="error">
  Failed to connect to the database. Please check your connection settings.
</Banner>
```

### Linked banner acting as a call-to-action

```tsx
<Banner to="/admin/collections/posts" type="info">
  You have 3 posts awaiting review. Click here to view them.
</Banner>
```
