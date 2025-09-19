# Storybook Documentation TODO

This file tracks the status of Storybook documentation for UI components in the PayloadCMS UI package.

## Components Without Stories

These components have MDX documentation but no interactive Storybook examples due to complex context requirements or minimal UI:

### Autosave

- **Location**: `src/elements/Autosave/`
- **Status**: ❌ No `.stories.tsx` file
- **Reason**: Complex PayloadCMS context dependencies (DocumentInfoProvider, form state, version control)
- **UI**: Minimal (text indicators: "Saving..." and "Last saved X ago")
- **Documentation**: ✅ Complete MDX documentation available
- **Notes**: Component requires full PayloadCMS form context that's difficult to mock in Storybook

## Guidelines

When deciding whether to create stories for a component:

1. **Create Stories If**:

   - Component has significant visual UI
   - Can be reasonably mocked without complex context
   - Demonstrates interactive behavior
   - Has multiple visual states worth showing

2. **Skip Stories If**:

   - Component relies heavily on PayloadCMS-specific context
   - Has minimal or text-only UI
   - Requires complex server-side dependencies
   - Better explained through documentation than visual examples

3. **Always Provide**:
   - Comprehensive MDX documentation
   - Props documentation
   - Usage examples in code
   - Integration patterns

## Status Legend

- ✅ Complete
- ❌ Missing
- 🔄 In Progress
- ⚠️ Needs Review
