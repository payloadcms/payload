# Button

The Button component is the primary action trigger in the Payload admin panel. It handles navigation, form submission, and destructive operations.

## Import

```tsx
import { Button } from '@payloadcms/ui'
```

## Usage

```tsx
<Button buttonStyle="primary" onClick={handleSave}>
  Save Document
</Button>
```

## Variants

| Style         | Use case                           |
| ------------- | ---------------------------------- |
| `primary`     | Main call-to-action (Save, Submit) |
| `secondary`   | Secondary actions (Cancel, Back)   |
| `subtle`      | Low-emphasis actions               |
| `destructive` | Irreversible actions (Delete)      |
| `ghost`       | Minimal visual weight              |
| `pill`        | Tag-style buttons                  |

## Props

| Prop          | Type                  | Default     | Description                |
| ------------- | --------------------- | ----------- | -------------------------- |
| `buttonStyle` | string                | `'primary'` | Visual style variant       |
| `size`        | `'medium' \| 'large'` | `'medium'`  | Button size                |
| `disabled`    | boolean               | `false`     | Disables interaction       |
| `icon`        | ReactNode             | —           | Icon shown alongside label |
| `onClick`     | function              | —           | Click handler              |

## Examples

### Primary action

```tsx
<Button buttonStyle="primary" onClick={handleSubmit}>
  Publish
</Button>
```

### Destructive action

```tsx
<Button buttonStyle="destructive" onClick={handleDelete}>
  Delete
</Button>
```

### Large secondary button

```tsx
<Button buttonStyle="secondary" size="large" onClick={handleCancel}>
  Cancel
</Button>
```
