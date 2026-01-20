# Config Patterns

Patterns for defining Payload configuration correctly.

---

## Pattern: Component definitions must be string paths

❌ **Bad:**

```typescript
components: {
  Nav: () => '<div>This is a custom tab!</div>'
}
```

✅ **Good:**

```typescript
components: {
  Nav: '/path/to/component/index.tsx#ExportName'
}
```

💡 **Why:** Config components cannot be functions, React components, or any other JavaScript values. They must be strings that map to the file path with the export name so the import map can resolve them correctly. The format is `'/path/to/file#ExportName'` where the path is relative to the project root and the export name follows the `#` symbol.

---
