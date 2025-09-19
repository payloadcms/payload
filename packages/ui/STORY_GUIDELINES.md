# Storybook Story Guidelines

This document establishes guidelines for creating effective, maintainable Storybook stories in the PayloadCMS UI package.

## Core Principles

### 1. One Basic Story Only

- **Create exactly ONE story per component** - the `Basic` story
- **No multiple variations** - keep it simple and focused
- **Focus on the most common usage** - show how the component is typically used
- **Avoid complexity** - don't create multiple stories for different states or variations
- **UI-focused approach** - prioritize visual demonstration over complex functionality

### 2. Real-World Examples Only

- **Every story must demonstrate actual usage patterns** from the PayloadCMS codebase
- **No contrived or artificial examples** - if it's not used in real code, don't create a story for it
- **Base stories on real component usage** found in admin views, forms, and other UI contexts
- **Each story must add unique value** - no redundant variations
- **Prioritize the most common and important use cases**

### 3. Meaningful Story Names

- Use descriptive names that explain the specific use case
- Examples:
  - ✅ `CollectionCard` (shows how collections appear in dashboard)
  - ✅ `LockedDocument` (shows locked state with user info)
  - ❌ `WithActions` (too generic)
  - ❌ `Variant2` (not descriptive)

## Story Structure

### Required Stories

1. **Basic** - The most common, simple usage (ONLY story needed)

### Story Naming Convention

```typescript
export const Basic: Story = {
  /* ... */
}
// Only create the Basic story - no additional stories needed
```

## Content Guidelines

### Props and Args

- **Use realistic prop values** that match actual usage
- **Include proper ARIA labels** and accessibility attributes
- **Use real URLs and paths** (e.g., `/admin/collections/posts`)
- **Include proper TypeScript types** for all props

### Documentation

- **Add meaningful descriptions** for each story
- **Explain the use case** and when to use this variant
- **Include any special requirements** or dependencies

### Examples

#### ✅ Good Story Example

```typescript
export const CollectionCard: Story = {
  args: {
    actions: (
      <Button
        aria-label="Create new Post"
        buttonStyle="icon-label"
        el="link"
        icon="plus"
        iconStyle="with-border"
        round
        to="/admin/collections/posts/create"
      />
    ),
    buttonAriaLabel: "Show all Posts",
    href: "/admin/collections/posts",
    id: "card-posts",
    title: "Posts",
    titleAs: "h3",
  },
  parameters: {
    docs: {
      description: {
        story: "A collection card as used in the PayloadCMS dashboard. Shows a create button action and navigates to the collection list.",
      },
    },
  },
}
```

#### ❌ Bad Story Example

```typescript
export const WithButton: Story = {
  args: {
    title: "Test Card",
    actions: <Button>Click me</Button>,
  },
  // No description, generic naming, not based on real usage
}
```

## File Organization

### Import Structure

```typescript
// 1. Storybook imports
import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'

// 2. Component imports (relative to current directory)
import { ComponentName } from './index.js'
import { RelatedComponent } from '../RelatedComponent/index.js'

// 3. Icon/utility imports (relative to src)
import { IconName } from '../../icons/IconName/index.js'
```

### File Location

- **Stories live next to their components** in `packages/ui/src/elements/ComponentName/`
- **File naming**: `ComponentName.stories.tsx`
- \*\*One story file per component`

### MDX Documentation

For comprehensive component documentation, create a companion MDX file:

#### File Structure

```
packages/ui/src/elements/ComponentName/
├── ComponentName.stories.tsx    # Storybook stories
├── ComponentName.mdx            # Documentation
├── index.tsx                    # Component implementation
├── types.ts                     # TypeScript types
```

#### MDX Best Practices

**Use list format for props** instead of tables (more reliable in MDX):

```mdx
**Props:**

- **propName** (`type`, required/optional) - Description
- **hasMany** (`boolean`, required) - Whether this relationship can have multiple values
- **onChange** (`(value: ValueWithRelation | ValueWithRelation[]) => void`, required) - Callback when a new relation is added
```

**MDX files should NOT include imports** - keep them simple and standalone:

```mdx
# Component Name

## Basic Usage

The component wraps any content and animates its height based on the `height` prop value. Click the "Open/Close" button in the Basic story to see the smooth animation in action.

## Props

**Props:**

- **propName** (`type`, required/optional) - Description
- **hasMany** (`boolean`, required) - Whether this relationship can have multiple values
```

**Avoid complex table formatting** - MDX parsers can be inconsistent with table rendering.
**No Canvas, Controls, or Meta imports** - keep MDX files simple and focused on documentation.

## Storybook Environment Setup

### Required Context Providers

All stories must be wrapped with PayloadCMS context providers. This is handled automatically by the `payloadContext: true` parameter in story parameters.

### Essential Mock Data

Stories require proper mock data to render correctly:

#### 1. Payload Config (`packages/ui/.storybook/payload.config.ts`)

- **Collections**: Include mock collections that components reference
- **Routes**: Provide admin and API routes
- **Admin Routes**: Include all required admin routes (inactivity, login, etc.)

#### 2. Permissions Structure

```typescript
permissions: {
  canAccessAdmin: true,
  collections: {
    [collectionSlug]: {
      create: true,
      read: true,
      update: true,
      delete: true,
      fields: {},
    },
  },
  globals: {},
}
```

#### 3. Required Translations

```typescript
translations: {
  general: {
    loading: 'Loading',
  },
  authentication: {
    youAreInactive: '...',
    stayLoggedIn: 'Stay logged in',
    logOut: 'Log out',
  },
  fields: {
    addNew: 'Add new',
  },
}
```

#### 4. Mock User Data

```typescript
user: {
  id: '1',
  email: 'storybook@example.com',
  collection: 'users',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
}
```

### API Mocking

The Storybook environment includes global fetch mocking to prevent real API calls:

- User API endpoints (`/api/users/me`)
- Permissions API (`/api/access`)
- Refresh token endpoints
- All other requests return 404

## Step-by-Step Story Creation Process

Based on our experience with the AddNewRelation component, follow this proven process:

### 1. Initial Setup

- Create `ComponentName.stories.tsx` with basic structure
- Start with minimal story configuration
- Focus on getting the component to render first

### 2. Fix Configuration Issues

- Add `as any` type assertion to payload config
- Include all required admin routes (`inactivity`, `login`, etc.)
- Set `autoRefresh: false` to prevent API calls
- Add complete translation keys (not partial)

### 3. Implement Global Fetch Mock

- Mock `/api/users/me` endpoint
- Mock `/api/access` endpoint
- Mock refresh token endpoints
- Handle both `string` and `URL` objects in fetch mock
- Return 404 for all other requests

### 4. Add Comprehensive Documentation

- Create `ComponentName.mdx` file
- Use list format for props (not tables)
- **NO imports** - keep MDX files simple and standalone
- Add usage examples, requirements, and troubleshooting
- Reference stories by name without using Canvas/Controls components

### 5. Test and Refine

- Verify component renders without errors
- Check browser console for missing translations
- Test permission-based rendering
- Ensure MDX documentation displays correctly

### 6. Final Polish

- Add proper TypeScript types
- Include realistic prop values
- Add accessibility attributes

## Quality Checklist

Before submitting a story, ensure:

- [ ] **Maximum 2 Stories**: Only `Basic` and one real-world example (e.g., `FAQExample`)
- [ ] **Real Usage**: Based on actual PayloadCMS codebase usage
- [ ] **Proper Props**: All props use realistic, production-ready values
- [ ] **Accessibility**: Includes proper ARIA labels and semantic HTML
- [ ] **Documentation**: Clear description of use case and context
- [ ] **TypeScript**: Properly typed with no `any` types (except for config)
- [ ] **Import Paths**: Uses correct relative imports
- [ ] **Simple & Focused**: Avoids complexity and multiple variations
- [ ] **Renders Correctly**: Component displays without errors in Storybook
- [ ] **Proper Permissions**: Component respects permission-based rendering
- [ ] **Mock Data**: Uses realistic data that matches component expectations
- [ ] **MDX Documentation**: Comprehensive documentation without imports (no Canvas/Controls)
- [ ] **Fetch Mocking**: All API calls are properly mocked
- [ ] **Complete Translations**: No missing translation keys in console

## Common Patterns

### Dashboard Components

- Show how components appear in the admin dashboard
- Include proper navigation URLs and admin routes
- Demonstrate permission-based rendering

### Form Components

- Show validation states (error, success, loading)
- Include proper form integration
- Demonstrate accessibility features

### Interactive Components

- Show hover, focus, and active states
- Include loading and disabled states
- Demonstrate keyboard navigation

### Animation/Wrapper Components

Animation and wrapper components require special attention in Storybook because they're not standalone UI elements but rather enhance other content. Follow these patterns:

#### Essential Stories for Animation Components

1. **Basic Demo** - Interactive example showing the component in action
2. **Real-World Example** - Practical use case (FAQ, dropdown, etc.)

**Maximum 2 stories per component** - keep it simple and focused. THIS IS SUPER IMPORTANT.

#### Key Principles

- **Show, Don't Just Tell** - Let users see the animation working
- **Interactive Controls** - Allow users to trigger animations and see results
- **Multiple Scenarios** - Demonstrate different content sizes and use cases
- **Explain the "Why"** - Help developers understand when and how to use the component
- **Technical Implementation** - Show the underlying hook or logic when relevant

#### Example: AnimateHeight Component

```typescript
// ✅ Good: Interactive demo showing how it works
export const Basic: Story = {
  render: () => <InteractiveDemo />,
  // Shows toggle functionality with real content
}

// ✅ Good: Real-world application
export const FAQExample: Story = {
  render: () => <FAQSection />,
  // Shows practical usage in FAQ section
}

// ❌ Avoid: Too many variations
// export const DifferentDurations: Story = { ... }
// export const TechnicalDetails: Story = { ... }
```

#### What to Include

- **Interactive Demos**: Buttons to trigger animations
- **Content Variations**: Different content sizes to test animation
- **Configuration Options**: Show how different props affect behavior
- **Real Use Cases**: Practical examples developers can relate to
- **Technical Details**: Explain the underlying implementation when helpful

### Data Display Components

- Show with real data structures
- Include empty and error states
- Demonstrate responsive behavior

## Troubleshooting Common Issues

### Component Not Rendering

**Problem**: Component appears empty or doesn't show up
**Solutions**:

- Check if component requires specific permissions (e.g., `permissions.collections[slug].create`)
- Verify all required translation keys are provided
- Ensure mock collections match what the component expects
- Check browser console for missing translation keys or permission errors

### "Failed to fetch" Errors

**Problem**: API calls failing in Storybook
**Solutions**:

- Ensure global fetch mock is applied before components load
- Check that mock handles both `string` and `URL` objects: `const urlString = typeof url === 'string' ? url : url.toString()`
- Verify mock returns proper Response objects with correct headers
- Add debug logging to see which URLs are being called

### Translation Key Errors

**Problem**: Console shows "key not found" errors
**Solutions**:

- Add missing translation keys to the `translations` object in `preview.tsx`
- Common missing keys: `general:loading`, `authentication:youAreInactive`, `fields:addNew`
- Use complete translation objects, not partial ones

### Permission-Based Rendering Issues

**Problem**: Components that should show based on permissions don't appear
**Solutions**:

- Ensure the `permissions` object includes the required collection permissions with proper structure
- Check that `canAccessAdmin: true` is set
- Verify collection permissions include `create: true` for components that create new documents

### TypeScript Errors

**Problem**: Type errors in story files
**Solutions**:

- Use proper types from PayloadCMS (e.g., `ValueWithRelation`)
- Ensure all required props are provided
- Check that mock data matches expected types
- Use `as any` type assertion for complex config objects in Storybook

### MDX Parsing Errors

**Problem**: MDX files fail to load or render incorrectly
**Solutions**:

- Use list format instead of tables for props documentation
- Avoid complex table formatting that can break MDX parsers
- Ensure proper imports: `import { Meta, Story, Canvas, Controls } from '@storybook/blocks'`
- Test MDX files in isolation before integrating with stories

### Context Provider Errors

**Problem**: "Cannot read properties of undefined" errors
**Solutions**:

- Ensure all required admin routes are defined in `payload.config.ts`
- Include `inactivity`, `login`, `logout` routes in `admin.routes`
- Set `autoRefresh: false` to prevent unwanted API calls
- Use `as any` type assertion for minimal configs

### Storybook Configuration Issues

**Problem**: Stories not loading or MDX not working
**Solutions**:

- Ensure `@storybook/addon-docs` is installed and configured
- Check that stories array includes `'../src/**/*.mdx'` pattern
- Verify MDX files are in the correct location next to story files

## Anti-Patterns to Avoid

- ❌ **Too many stories per component** - maximum 2 stories (Basic + one real-world example)
- ❌ **Complex variations** - avoid multiple states, themes, or configurations
- ❌ **Generic examples** without context
- ❌ **Contrived prop combinations** not used in real code
- ❌ **Missing accessibility attributes**
- ❌ **Hardcoded placeholder data** instead of realistic examples
- ❌ **Poor naming** that doesn't explain the use case
- ❌ **Missing permissions** - components that check permissions won't render without proper mock data
- ❌ **Incomplete translations** - missing translation keys cause console errors
- ❌ **MDX imports** - avoid Canvas, Controls, Meta imports in MDX files

## Review Process

When reviewing stories:

1. **Verify real usage** - Check if the pattern exists in the codebase
2. **Test accessibility** - Ensure proper ARIA labels and keyboard navigation
3. **Validate props** - Confirm all props use realistic values
4. **Check documentation** - Ensure descriptions are clear and helpful
5. **Test rendering** - Ensure stories render without error

---

_These guidelines ensure that our Storybook serves as a comprehensive, realistic reference for PayloadCMS UI components, helping developers understand how to use components effectively in real applications._
