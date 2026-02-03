# Translation Patterns

## Pattern: Use getTranslation for all label types

❌ **Bad:**

```typescript
if (typeof tab.label === 'function') {
  labelText = tab.label({ t })
} else if (typeof tab.label === 'string') {
  labelText = tab.label
} else if (tab.label && typeof tab.label === 'object') {
  labelText = getTranslation(tab.label, i18n)
} else {
  labelText = tab.slug
}
```

✅ **Good:**

```typescript
const labelText = tab.label ? getTranslation(tab.label, i18n) : tab.slug
```

💡 **Why:** `getTranslation` from `@payloadcms/translations` already handles functions, strings, and translation objects. Don't write custom logic for different label types. See CLAUDE.md line 65.

---
