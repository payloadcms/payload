# CheckboxPopup

Popup menu component with a list of checkboxes for multi-select functionality.

## Quick Reference

### Props

- `Button` (`React.ReactNode`, required) - Trigger button element
- `onChange` (`(args: { close: () => void; selectedValues: string[] }) => void`, required) - Selection change handler
- `options` (`Array<{ label: string; value: string }>`, required) - Options to display
- `selectedValues` (`string[]`, required) - Currently selected values
- `className` (`string`, optional) - Additional CSS class

### Usage

```tsx
<CheckboxPopup
  Button={<Button>Select Options</Button>}
  onChange={({ selectedValues }) => setSelected(selectedValues)}
  options={[
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
  ]}
  selectedValues={selected}
/>
```

### Features

- Multi-select functionality
- Popup positioning
- Selection state management
- Scrollable option list
- Keyboard navigation

## Files

- `index.tsx` - Component implementation
- `index.scss` - Component styles
- `CheckboxPopup.stories.tsx` - Storybook stories
- `CheckboxPopup.mdx` - Comprehensive documentation
