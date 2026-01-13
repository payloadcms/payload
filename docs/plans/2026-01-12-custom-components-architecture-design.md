# Custom Components & Server/Client Architecture

## Overview

This document explains how Payload's server/client architecture works, focusing on how custom components are registered, resolved, and rendered across the RSC boundary. This is critical knowledge for implementing UI features and understanding how field components integrate with form state.

## Server-to-Client Field Transformation

### The ClientField Conversion Process

Server-side field configurations contain functions, hooks, and validation logic that cannot be serialized to the client. The `createClientField()` function strips these server-only properties before sending field configs to the client.

**Server-Only Field Properties (Stripped):**

- `hooks` - Field-level lifecycle hooks
- `access` - Access control functions
- `validate` - Validation functions
- `defaultValue` - Can be a function
- `filterOptions` - Relationship/select filter functions
- `editor` - RichText editor config (server-only)
- `custom` - Custom server-side data
- `dbName` / `enumName` - Can be functions
- `graphQL` - GraphQL schema config

**Server-Only Admin Properties (Stripped):**

- `condition` - Conditional logic functions
- `components` - Component definitions (converted separately)

**What Gets Sent to Client:**

- Field type, name, label (resolved if function)
- Admin UI config (className, placeholder, description if not a function)
- Validation constraints (minLength, maxLength, required) - values only, not functions
- Options for select/radio (with labels resolved if functions)
- Nested field structures (recursively processed)

**Key Files:**

- [packages/payload/src/fields/config/client.ts](../../packages/payload/src/fields/config/client.ts) - `createClientField()`, `createClientFields()`, `createClientBlocks()`

### Label and Description Resolution

Functions for labels and descriptions are executed on the server and converted to strings:

```typescript
if (typeof field.label === 'function') {
  clientField.label = field.label({ i18n, t: i18n.t })
} else {
  clientField.label = field.label
}
```

This applies to:

- Field labels
- Select/radio option labels
- Block labels (singular/plural)
- Array field labels
- Tab labels and descriptions

## Import Map System

### How Custom Components Are Registered

Payload uses an import map system to handle component references across the server/client boundary.

**User Configuration (Server):**
Users define components as file paths in their Payload config:

```typescript
{
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        components: {
          Label: './MyCustomLabel.tsx#MyCustomLabel',
        },
      },
    },
  ]
}
```

**Build-Time Processing:**

- The build process scans config for component references
- Generates an import map in `.next/server` that associates paths with actual imports
- Component references are converted to: `{ exportName: 'MyCustomLabel', path: './MyCustomLabel.tsx' }`

**Runtime Resolution:**
The `getFromImportMap()` utility resolves string references to actual React components:

```typescript
const ResolvedComponent = getFromImportMap({
  importMap,
  PayloadComponent: componentReference,
  schemaPath: '',
})
```

**Key Files:**

- [packages/ui/src/elements/RenderServerComponent/index.tsx](../../packages/ui/src/elements/RenderServerComponent/index.tsx) - Component resolution and rendering

### RenderServerComponent vs RenderCustomComponent

**RenderServerComponent:**

- Used for server-side component rendering
- Automatically detects if component is RSC or client component
- Passes server props (req, data, permissions) ONLY to RSCs
- Strips `$undefined` values to prevent RSC serialization errors
- Handles arrays of components
- Falls back to Fallback component if resolution fails

**Usage Pattern:**

```typescript
<RenderServerComponent
  Component={customComponent}
  importMap={importMap}
  serverProps={{ req, data }}
  clientProps={{ label, required }}
  Fallback={<DefaultLabel />}
/>
```

**RenderCustomComponent (Client-Side):**

- Used on client for rendering user-provided components
- Simpler - just renders component or fallback
- `undefined` renders Fallback, `null` renders nothing
- No server prop handling

## Form State Generation

### From Document Data to Form State

When opening a document in the admin UI, `fieldSchemasToFormState()` transforms the database document into form state.

**Process Flow:**

1. **Input Collection:**

   - Field schemas from config
   - Document data from database
   - User permissions
   - Previous form state (for re-renders)
   - Document preferences

2. **Field Iteration:**

   - `iterateFields()` walks through each field schema
   - For each field:
     - Calculates initial value (from data or defaultValue)
     - Runs validation (server-side)
     - Checks read access permissions
     - Optionally renders field components as RSCs
     - Recursively processes nested fields (array, group, blocks, tabs)

3. **Output Structure:**
   ```typescript
   FormState = {
     fieldName: {
       value: any,
       initialValue: any,
       valid: boolean,
       errorMessage?: string,
       passesReadAccess: boolean,
       customComponents?: {
         Label?: React.ReactNode,
         Description?: React.ReactNode,
         Error?: React.ReactNode,
         BeforeInput?: React.ReactNode,
         AfterInput?: React.ReactNode
       }
     }
   }
   ```

**Key Concepts:**

- **Server-side validation:** Initial validation runs on server, results included in form state
- **Component pre-rendering:** Custom RSC components are rendered on server and included in form state
- **Nested data handling:** Array/block fields maintain parent context through `fullData` vs `data` separation
- **Permission integration:** Read access is checked per-field, results stored in `passesReadAccess`

**Key Files:**

- [packages/ui/src/forms/fieldSchemasToFormState/index.tsx](../../packages/ui/src/forms/fieldSchemasToFormState/index.tsx) - Main form state generation
- [packages/ui/src/forms/fieldSchemasToFormState/iterateFields.ts](../../packages/ui/src/forms/fieldSchemasToFormState/iterateFields.ts) - Field iteration logic

### The Dual Schema Map System

Payload maintains two parallel schema maps for efficient field lookups:

**FieldSchemaMap (Server-Side):**

- Contains full field configurations with functions
- Used during form state generation
- Enables path-based field lookups: `schemaMap.get('arrayField.0.nestedField')`
- Includes hooks, validation, access control, defaultValue functions

**ClientFieldSchemaMap (Client-Side):**

- Stripped versions with only serializable data
- Contains rendered RSC components
- Used by client-side form validation and field rendering
- Path-based lookups for field configs on client

**Usage Pattern:**

```typescript
const fieldSchema = fieldSchemaMap.get(path)
const clientFieldSchema = clientFieldSchemaMap.get(path)
```

This dual map system allows both server and client to efficiently find field configurations by path without traversing the entire field tree.

## Client-Side Form Management

### Form Context Architecture

Once form state reaches the client, it's managed through a reducer pattern with performance optimizations.

**Core Context System:**

**FormProvider:**

- Wraps document edit views (collection-edit, global-edit)
- Holds form state in a reducer
- Provides form-level operations (submit, reset, getData)
- Manages modified state and autosave

**Performance Optimization:**

- Uses `use-context-selector` package to prevent unnecessary re-renders
- Components subscribe only to the specific fields they need
- Selector functions extract minimal data from form state

**useField() Hook - Primary Interface:**

```typescript
const {
  setValue, // Dispatch value updates to reducer
  value, // Current field value
  showError, // Boolean - should error be shown
  errorMessage, // Validation error message
  initialValue, // Original value
  customComponents, // Pre-rendered RSC components
  disabled, // Computed disabled state
  path, // Resolved field path
} = useField({
  path: 'fieldName',
  validate: memoizedValidate,
})
```

**Key Behaviors:**

- **Auto-registration:** `useField()` automatically registers fields in form state if they don't exist
- **Value updates:** `setValue(value)` dispatches to reducer - ALWAYS pass values, never events
- **Validation timing:** Client-side validation runs on blur and form submit
- **Error display:** `showError` only becomes true after field is touched or form submitted
- **Path resolution:** Can use `path` or `potentiallyStalePath` for dynamic field paths

### Reading Other Fields

Use `useFormFields()` with a selector to read field values without causing re-renders:

```typescript
const email = useFormFields(([fields]) => fields.email?.value)
const { title, status } = useFormFields(([fields]) => ({
  title: fields.title?.value,
  status: fields.status?.value,
}))
```

**Selector Function Pattern:**

- Receives `[fields, dispatch]` array
- Return only the data you need
- Component re-renders only when returned data changes

### Form-Level Operations

```typescript
const {
  submit, // Submit form (runs validation, calls onSubmit)
  reset, // Reset to initial values
  getData, // Get current form data
  setModified, // Mark form as modified
  fields, // Access to all fields (use sparingly - triggers re-renders)
} = useForm()
```

**Critical Pattern:** Never use local `useState()` for field values. The form context is the single source of truth. Field components should always use `useField()` to connect to form state.

**Key Files:**

- [packages/ui/src/forms/useField/index.tsx](../../packages/ui/src/forms/useField/index.tsx) - Field hook implementation
- [packages/ui/src/forms/Form/index.tsx](../../packages/ui/src/forms/Form/index.tsx) - Form context provider

## Field Component Implementation Patterns

### Standard Field Component Structure

Field components in Payload follow a consistent two-layer pattern.

**Server-Side Field Config:**

```typescript
// packages/payload/src/admin/fields/Text.ts
export const textFieldConfig = {
  Component: '@payloadcms/ui/fields/Text#TextField',
}
```

**Client-Side Field Component:**

```typescript
// packages/ui/src/fields/Text/index.tsx
'use client'

const TextFieldComponent: TextFieldClientComponent = (props) => {
  const {
    field,
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  // 1. Memoize validation with field-specific rules
  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, maxLength, minLength, required })
      }
    },
    [validate, minLength, maxLength, required]
  )

  // 2. Connect to form state
  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  })

  // 3. Render presentation component
  return (
    <TextInput
      Label={Label}
      Description={Description}
      Error={Error}
      BeforeInput={BeforeInput}
      AfterInput={AfterInput}
      value={value || ''}
      onChange={(e) => setValue(e.target.value)}
      readOnly={readOnly || disabled}
      showError={showError}
      // ... other props
    />
  )
}

// 4. Wrap with withCondition for conditional logic support
export const TextField = withCondition(TextFieldComponent)
```

### The Two-Component Pattern

Many fields split into two files for separation of concerns:

**index.tsx - Smart Component:**

- Connects to form state via `useField()`
- Handles validation memoization
- Manages field-specific logic (hasMany, localization, etc.)
- Extracts custom components from form state
- Contains `'use client'` directive

**Input.tsx - Presentation Component:**

- Receives all props explicitly
- Renders UI elements
- Handles user interactions via callbacks
- No form state dependency
- Reusable and testable

**Benefits:**

- Clear separation of form logic and presentation
- Input component can be exported and reused
- Easier to test presentation separately
- Reduces complexity in main component

### Component Injection Points

Fields support custom component injection at multiple points:

**Standard Injection Points:**

- `Label` - Replace default field label
- `Description` - Replace default description text
- `Error` - Replace default error message display
- `BeforeInput` - Content rendered before input element
- `AfterInput` - Content rendered after input element

**How They Work:**

1. **User defines in config:**

```typescript
{
  name: 'title',
  type: 'text',
  admin: {
    components: {
      Label: './CustomLabel.tsx#CustomLabel',
      BeforeInput: './CustomBeforeInput.tsx#CustomBeforeInput'
    }
  }
}
```

2. **Server renders as RSCs:**
   Components are rendered during form state generation with access to server props (req, data, permissions)

3. **Client receives pre-rendered:**
   `useField()` returns these as `customComponents`, already rendered and ready to display

4. **Field renders with RenderCustomComponent:**

```typescript
<RenderCustomComponent
  CustomComponent={Label}
  Fallback={<FieldLabel label={label} required={required} />}
/>
```

**Note:** `undefined` renders Fallback, `null` renders nothing. This allows users to explicitly hide default components.

### Critical Patterns for Field Components

**DO:**

- Always use `'use client'` directive
- Always wrap with `withCondition()`
- Always memoize validation with `useCallback()` including all field config dependencies
- Pass values to `setValue()`: `setValue(e.target.value)`
- Use `useField()` for all field state management
- Handle both `readOnly` prop and `disabled` from `useField()`

**DON'T:**

- Pass events to `setValue()`: ~~`setValue(event)`~~
- Use local `useState()` for field values
- Forget to include field config in validation memoization deps
- Use `useEffect` to watch value changes and call callbacks
- Access form state directly without `useField()` or `useFormFields()`

### Example: Custom Field Component

```typescript
'use client'
import type { TextFieldClientComponent } from 'payload'
import { useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import { withCondition } from '@payloadcms/ui'

const MyCustomFieldComponent: TextFieldClientComponent = (props) => {
  const {
    field: { label, required, admin: { placeholder } = {} },
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required]
  )

  const {
    customComponents: { Label, Error } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  })

  return (
    <div>
      {Label || <label>{label}</label>}
      <input
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={readOnly || disabled}
      />
      {showError && Error}
    </div>
  )
}

export const MyCustomField = withCondition(MyCustomFieldComponent)
```

## Key Files Reference

### Server/Client Transformation

- `packages/payload/src/fields/config/client.ts` - ClientField creation
- `packages/payload/src/collections/config/client.ts` - Collection config transformation
- `packages/payload/src/globals/config/client.ts` - Global config transformation

### Component Resolution

- `packages/ui/src/elements/RenderServerComponent/index.tsx` - Server component rendering
- `packages/ui/src/utilities/RenderCustomComponent.tsx` - Client component rendering
- `packages/payload/src/bin/generateImportMap/` - Import map generation

### Form State

- `packages/ui/src/forms/fieldSchemasToFormState/index.tsx` - Form state generation
- `packages/ui/src/forms/fieldSchemasToFormState/iterateFields.ts` - Field iteration
- `packages/ui/src/utilities/buildClientFieldSchemaMap/` - Client schema map building

### Form Management

- `packages/ui/src/forms/Form/index.tsx` - Form provider
- `packages/ui/src/forms/useField/index.tsx` - Field hook
- `packages/ui/src/forms/withCondition/index.tsx` - Conditional logic wrapper

### Field Components

- `packages/ui/src/fields/` - All field component implementations
- `packages/payload/src/admin/fields/` - Server-side field configs

## Summary

Understanding this architecture is crucial for:

- Implementing new field types
- Adding custom component support to existing features
- Debugging form state issues
- Understanding what data is available on server vs client
- Building performant UI components that integrate with Payload's form system

The key insight is that Payload pre-processes everything on the server (validation, permissions, component rendering) and ships results to the client, keeping the client lightweight and performant.
