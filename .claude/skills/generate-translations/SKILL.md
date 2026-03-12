---
name: generate-translations
description: Generates i18n translation strings for all supported locales when new keys are added to core packages or plugins. Runs OpenAI-powered translation scripts, scaffolds plugin translation folders, and validates output files. Use when adding translation keys, creating localization files, running generateTranslations scripts, or setting up i18n for a new plugin.
allowed-tools: Write, Bash(date:*), Bash(mkdir -p *)
---

# Translation Generation Guide

Payload has two separate translation systems:

1. **Core Translations** - for core Payload packages (packages/ui, packages/payload, packages/next)
2. **Plugin Translations** - for plugins (packages/plugin-\*)

## 1. Core Translations

**When to use:** Adding translations to core Payload packages (packages/ui, packages/payload, packages/next)

### Steps:

1. **Add the English translation** to `packages/translations/src/languages/en.ts`

   - Add your new key/value to the appropriate section (e.g., `authentication`, `general`, `fields`, etc.)
   - Use nested objects for organization
   - Example:
     ```typescript
     export const enTranslations = {
       authentication: {
         // ... existing keys
         newFeature: 'New Feature Text',
       },
     }
     ```

2. **Add client key** (if needed for client-side usage) to `packages/translations/src/clientKeys.ts`

   - Add the translation key path using colon notation
   - Example: `'authentication:newFeature'`
   - Client keys are used for translations that need to be available in the browser

3. **Generate translations for all languages**
   - Change directory: `cd tools/scripts`
   - Run: `pnpm generateTranslations:core`
   - This auto-translates your new English keys to all other supported languages

4. **Verify**: Confirm the new keys appear in at least one non-English locale file (e.g., `packages/translations/src/languages/es.ts`). If generation fails, check that `OPENAI_KEY` is set in `.env`.

---

## 2. Plugin Translations

**When to use:** Adding translations to any plugin package (packages/plugin-\*)

### Steps:

1. **Verify plugin has translations folder**

   - Check if `packages/plugin-{name}/src/translations` exists
   - If it doesn't exist, see "Scaffolding New Plugin Translations" below

2. **Add the English translation** to the plugin's `packages/plugin-{name}/src/translations/languages/en.ts`

   - Plugin translations are namespaced under the plugin name
   - Example for plugin-multi-tenant:
     ```typescript
     export const enTranslations = {
       'plugin-multi-tenant': {
         'new-feature-label': 'New Feature',
       },
     }
     ```

3. **Generate translations for all languages**
   - Change directory: `cd tools/scripts`
   - Run the plugin-specific script: `pnpm generateTranslations:plugin-{name}`
   - Examples:
     - `pnpm generateTranslations:plugin-multi-tenant`
     - `pnpm generateTranslations:plugin-ecommerce`
     - `pnpm generateTranslations:plugin-import-export`

4. **Verify**: Check that new keys appear in the plugin's `packages/plugin-{name}/src/translations/languages/es.ts` (or another non-English locale). If generation fails, check that `OPENAI_KEY` is set in `.env`.

### Scaffolding New Plugin Translations

If a plugin doesn't have a translations folder yet, **ask the user if they want to scaffold one**.

#### Structure to create:

```
packages/plugin-{name}/src/translations/
├── index.ts
├── types.ts
└── languages/
    ├── en.ts
    ├── es.ts
    └── ... (all other language files)
```

#### Files to create:

1. **types.ts** - Define the plugin's translation types
2. **index.ts** - Export all translations and re-export types
3. **languages/en.ts** - English translations (the source for generation)
4. **languages/\*.ts** - Other language files (initially empty, will be generated)

#### Generation script to create:

1. Create `tools/scripts/src/generateTranslations/plugin-{name}.ts`

   - Use `plugin-multi-tenant.ts` as a template
   - Update the import paths to point to the new plugin
   - Update the targetFolder path

2. Add script to `tools/scripts/package.json`:
   ```json
   "generateTranslations:plugin-{name}": "node --no-deprecation --import @swc-node/register/esm-register src/generateTranslations/plugin-{name}.ts"
   ```

---

## Important Notes

- All translation generation requires `OPENAI_KEY` environment variable to be set
- The generation scripts use OpenAI to translate from English to other languages
- Always add translations to English first - it's the source of truth
- **Core translations**: Client keys are only needed for translations used in the browser/admin UI
- **Plugin translations**: Automatically namespaced under the plugin name to avoid conflicts
