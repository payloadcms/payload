# Payload Storybook Documentation

This documentation provides comprehensive guidance for adding and maintaining Storybook stories for Payload CMS components. This Storybook showcases components from `@payloadcms/ui` with authentic styling and behavior.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Adding Elements](#adding-elements)
3. [Adding Fields](#adding-fields)
4. [Adding Views](#adding-views)
5. [Adding Icons](#adding-icons)
6. [Styling Guidelines](#styling-guidelines)
7. [Mock Providers](#mock-providers)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

This Storybook uses a **hybrid approach** that combines:

- **Real Payload components** where possible (Button, Pill, Gutter, etc.)
- **Authentic HTML structure** that matches Payload's exact DOM structure
- **Direct SCSS imports** from Payload's source files (zero custom CSS)
- **Comprehensive mock providers** for complex component dependencies

### Key Principles

1. **Zero Custom CSS**: All styling comes directly from Payload's SCSS files
2. **Authentic Structure**: Use exact same HTML structure and CSS classes as real Payload
3. **Real Components First**: Prefer importing real Payload components over recreating them
4. **Future-Proof**: Changes to Payload styles automatically update Storybook

## Adding Elements

Elements are basic UI components like buttons, cards, modals, etc.

### Step 1: Create the Story File

Create a new file in `stories/ui/elements/`:

```tsx
// stories/ui/elements/NewElement.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

// Import the real Payload component if available
import { NewElement } from '@payloadcms/ui'

// Import required providers
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Import Payload's authentic styling (no custom CSS)
import '../../../packages/ui/src/elements/NewElement/index.scss'

const meta: Meta<typeof NewElement> = {
  component: NewElement,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ padding: '4px', background: 'var(--theme-bg)' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Description of the NewElement component and its purpose.',
      },
    },
  },
  title: 'UI/Elements/NewElement',
}

export default meta
type Story = StoryObj<typeof NewElement>

export const Default: Story = {
  args: {
    // Add props here
  },
}

export const WithVariant: Story = {
  args: {
    variant: 'secondary',
    // Other props
  },
}
```

### Step 2: Handle Complex Dependencies

If the component requires complex contexts, create a simplified version:

```tsx
// If the real component doesn't work due to context dependencies
const SimpleNewElement: React.FC<NewElementProps> = (props) => {
  return (
    <div className="new-element new-element--default">
      {/* Use authentic Payload HTML structure and CSS classes */}
    </div>
  )
}

// Use the simplified version in stories
const meta: Meta<typeof SimpleNewElement> = {
  component: SimpleNewElement,
  // ...
}
```

### Step 3: Add Multiple Variants

Create comprehensive stories showing different states:

```tsx
export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithIcon: Story = {
  args: {
    icon: <SomeIcon />,
  },
}
```

## Adding Fields

Field components are form inputs like text fields, selects, checkboxes, etc.

### Step 1: Create Mock Field Component

Fields typically require complex form contexts, so create a mock version:

```tsx
// stories/ui/fields/NewField.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'

// Import required styling
import '../../../packages/ui/src/fields/NewField/index.scss'
import '../../../packages/ui/src/scss/styles.scss'

interface NewFieldProps {
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  value?: any
  onChange?: (value: any) => void
}

const NewField: React.FC<NewFieldProps> = ({
  name,
  label,
  required = false,
  disabled = false,
  value = '',
  onChange,
}) => {
  const [fieldValue, setFieldValue] = useState(value)

  const handleChange = (newValue: any) => {
    setFieldValue(newValue)
    onChange?.(newValue)
  }

  // Use authentic Payload field structure
  return (
    <div className="field-type new-field">
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrap">{/* Your field implementation using Payload CSS classes */}</div>
    </div>
  )
}

const meta: Meta<typeof NewField> = {
  component: NewField,
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', background: 'var(--theme-bg)' }}>
        <Story />
      </div>
    ),
  ],
  title: 'UI/Fields/NewField',
}

export default meta
type Story = StoryObj<typeof NewField>

export const Default: Story = {
  args: {
    name: 'newField',
    label: 'New Field',
  },
}

export const Required: Story = {
  args: {
    name: 'newField',
    label: 'Required Field',
    required: true,
  },
}

export const WithError: Story = {
  args: {
    name: 'newField',
    label: 'Field with Error',
    // Add error state styling
  },
}
```

### Step 2: Use Authentic Payload CSS Classes

Study existing field components to understand Payload's CSS class patterns:

```scss
// Common Payload field classes:
.field-type          // Base field wrapper
.field-label         // Field label
.required           // Required indicator
.input-wrap         // Input wrapper
.error             // Error state
.read-only         // Disabled/read-only state
```

### Step 3: Add Interactive Examples

```tsx
export const Interactive: Story = {
  args: {
    name: 'interactive',
    label: 'Interactive Field',
    onChange: (value) => console.log('Field changed:', value),
  },
}
```

## Adding Views

Views are complex components like ListView, EditView, etc.

### Step 1: Use the Hybrid Approach

Follow the pattern established in `HybridListView.tsx`:

```tsx
// stories/ui/views/NewView.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

// Import real Payload components where possible
import { Gutter, Button } from '@payloadcms/ui'

// Import authentic Payload styling
import '../../../packages/ui/src/views/NewView/index.scss'
import '../../../packages/ui/src/scss/styles.scss'

const NewView: React.FC<NewViewProps> = (props) => {
  return (
    <div className="new-view">
      <Gutter className="new-view__wrap">
        {/* Use real Payload components where possible */}
        <header className="view-header">
          <h1 className="view-header__title">View Title</h1>
          <Button buttonStyle="primary" size="small">
            Action Button
          </Button>
        </header>

        {/* Use authentic HTML structure with Payload CSS classes */}
        <div className="view-content">{/* Content here */}</div>
      </Gutter>
    </div>
  )
}

const meta: Meta<typeof NewView> = {
  component: NewView,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ background: 'var(--theme-bg)', minHeight: '100vh' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  title: 'UI/Views/NewView',
}
```

### Step 2: Study Real Payload Views

Before creating a view story:

1. Examine the real component in `packages/ui/src/views/`
2. Identify the HTML structure and CSS classes used
3. Note which sub-components can be imported from `@payloadcms/ui`
4. Create mock versions only for components with complex dependencies

## Adding Icons

### Step 1: Import from Payload

```tsx
// stories/ui/icons/NewIcon.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

// Import the real icon from Payload
import { NewIcon } from '@payloadcms/ui'

const meta: Meta<typeof NewIcon> = {
  component: NewIcon,
  decorators: [
    (Story) => (
      <div style={{ padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  title: 'UI/Icons/NewIcon',
}

export default meta
type Story = StoryObj<typeof NewIcon>

export const Default: Story = {}

export const Large: Story = {
  decorators: [
    (Story) => (
      <div style={{ fontSize: '48px' }}>
        <Story />
      </div>
    ),
  ],
}
```

### Step 2: Create Icon Showcase

Add new icons to the IconShowcase story for easy browsing.

## Styling Guidelines

### DO ✅

1. **Import Payload SCSS files directly**:

   ```tsx
   import '../../../packages/ui/src/elements/Button/index.scss'
   ```

2. **Use authentic Payload CSS classes**:

   ```tsx
   <button className="btn btn--style-primary btn--size-small">
   ```

3. **Use Payload design tokens**:

   ```tsx
   style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
   ```

4. **Import real Payload components**:
   ```tsx
   import { Button, Pill, Gutter } from '@payloadcms/ui'
   ```

### DON'T ❌

1. **Never add custom CSS**:

   ```tsx
   // ❌ Don't do this
   const customStyles = `
     .my-custom-button { ... }
   `
   ```

2. **Don't use non-Payload CSS classes**:

   ```tsx
   // ❌ Don't do this
   <button className="custom-button">
   ```

3. **Don't recreate components that already exist**:
   ```tsx
   // ❌ Don't do this if Button already exists in @payloadcms/ui
   const CustomButton = () => <button>...</button>
   ```

## Mock Providers

### Using Existing Providers

Most stories should use the comprehensive `PayloadMockProviders`:

```tsx
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// In your decorator:
decorators: [
  (Story) => (
    <PayloadMockProviders>
      <Story />
    </PayloadMockProviders>
  ),
],
```

### Available Mock Providers

- `PayloadMockProviders` - Comprehensive provider with all contexts
- `MockConfigProvider` - Configuration context
- `MockTranslationProvider` - i18n context
- `MockSelectionProvider` - Selection context for lists
- `MockListQueryProvider` - List data context
- `MockTableColumnsProvider` - Table column configuration

### Adding New Mock Providers

If you need additional context providers:

1. Add them to `_mocks/MockProviders.tsx`
2. Follow the existing pattern:

```tsx
const MockNewContext = createContext({
  // Mock values
})

export const MockNewProvider = ({ children }) => {
  return (
    <MockNewContext
      value={
        {
          // Mock implementation
        }
      }
    >
      {children}
    </MockNewContext>
  )
}

// Add to PayloadMockProviders
export const PayloadMockProviders = ({ children }) => {
  return (
    <ExistingProviders>
      <MockNewProvider>{children}</MockNewProvider>
    </ExistingProviders>
  )
}
```

## Best Practices

### Component Organization

```
stories/
├── ui/
│   ├── elements/     # Basic UI components
│   ├── fields/       # Form field components
│   ├── views/        # Complex view components
│   ├── icons/        # Icon components
│   └── providers/    # Provider components
├── _mocks/          # Mock providers and utilities
└── README.md        # This documentation
```

### Naming Conventions

- **Story files**: `ComponentName.stories.tsx`
- **Component exports**: `ComponentName` (PascalCase)
- **Story exports**: `Default`, `WithVariant`, `Loading`, etc.
- **CSS classes**: Follow Payload's kebab-case conventions

### Story Structure

```tsx
const meta: Meta<typeof Component> = {
  component: Component,
  decorators: [
    /* Providers */
  ],
  parameters: {
    docs: {
      description: {
        component: 'Component description',
      },
    },
  },
  title: 'UI/Category/Component',
}

export default meta
type Story = StoryObj<typeof Component>

// Always include a Default story
export const Default: Story = {
  args: {},
}

// Add variants that show different use cases
export const Variant: Story = {
  args: {
    variant: 'secondary',
  },
}
```

### Documentation

- Add meaningful descriptions to components and stories
- Include JSDoc comments for complex props
- Document any special setup requirements
- Add examples showing real-world usage

## Troubleshooting

### Common Issues

#### "useConfig is undefined" Error

This means you need the ConfigProvider. Add `PayloadMockProviders` to your decorator:

```tsx
decorators: [
  (Story) => (
    <PayloadMockProviders>
      <Story />
    </PayloadMockProviders>
  ),
],
```

#### Styling Doesn't Match Payload

1. Check that you're importing the correct SCSS file
2. Verify you're using authentic Payload CSS classes
3. Compare with the real Payload component structure
4. Use browser dev tools to inspect real Payload admin

#### Component Won't Import

1. Check if the component is exported in `@payloadcms/ui`
2. Look in `packages/ui/src/exports/client/index.ts`
3. If not exported, create a simplified version using authentic structure

#### TypeScript Errors

1. Import proper types from `payload` package
2. Create interface definitions for mock components
3. Use `Partial<>` types for optional props in mocks

### Getting Help

1. Check existing similar stories for patterns
2. Examine real Payload components in `packages/ui/src/`
3. Use browser dev tools to inspect real Payload admin interface
4. Test changes against real Payload interface for visual parity

### Debugging Tips

1. Use `console.log` in mock providers to verify context values
2. Compare DOM structure with real Payload using dev tools
3. Check that all required SCSS files are imported
4. Validate CSS class names match Payload conventions

## Example: Complete Element Story

Here's a complete example showing all best practices:

```tsx
// stories/ui/elements/StatusPill.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

// Import real component if available
import { Pill } from '@payloadcms/ui'

// Import mock providers
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Import authentic Payload styling
import '../../../packages/ui/src/elements/Pill/index.scss'

interface StatusPillProps {
  status: 'success' | 'warning' | 'error'
  children: React.ReactNode
}

const StatusPill: React.FC<StatusPillProps> = ({ status, children }) => {
  return (
    <Pill pillStyle={status === 'success' ? 'success' : 'warning'} size="small">
      {children}
    </Pill>
  )
}

const meta: Meta<typeof StatusPill> = {
  component: StatusPill,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ padding: '16px', background: 'var(--theme-bg)' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Status pill component showing different states using Payload Pill component.',
      },
    },
  },
  title: 'UI/Elements/StatusPill',
}

export default meta
type Story = StoryObj<typeof StatusPill>

export const Default: Story = {
  args: {
    status: 'success',
    children: 'Active',
  },
}

export const Warning: Story = {
  args: {
    status: 'warning',
    children: 'Pending',
  },
}

export const Error: Story = {
  args: {
    status: 'error',
    children: 'Failed',
  },
}

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <StatusPill status="success">Success</StatusPill>
      <StatusPill status="warning">Warning</StatusPill>
      <StatusPill status="error">Error</StatusPill>
    </div>
  ),
}
```

This documentation should provide everything needed to maintain and extend the Storybook with authentic Payload components and styling.
