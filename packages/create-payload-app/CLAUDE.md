# create-payload-app

Package for creating new Payload projects with custom configurations.

## Architecture

### AST-Based File Modification

create-payload-app uses AST (Abstract Syntax Tree) parsing with ts-morph to modify template files during project creation.

**3-Phase Pipeline:**

1. **Detection** - Parse files and locate expected structures
2. **Transformation** - Pure functions modify AST
3. **Modification** - Validate, write, format with prettier

### File Structure

```txt
src/lib/ast/
├── types.ts                    # Shared types for AST operations
├── utils.ts                    # Low-level AST helpers
├── utils.spec.ts              # Unit tests for utils
├── payload-config.ts          # Payload config transformations
├── payload-config.spec.ts    # Unit tests for payload-config
├── package-json.ts            # package.json modifications
└── package-json.spec.ts      # Unit tests for package-json
```

### Key Functions

**High-level API:**

- `configurePayloadConfig(filePath, options)` - Main entry point for payload config
- `updatePackageJson(filePath, options)` - Update package.json

**Transformations:**

- `addDatabaseAdapter(sourceFile, adapter, envVar)` - Add/replace db adapter
- `addStorageAdapter(sourceFile, adapter)` - Add storage plugin
- `removeSharp(sourceFile)` - Remove sharp dependency

### Templates

All templates follow standard structure:

- `buildConfig()` call with object literal argument
- `db` property for database adapter
- `plugins` array (can be empty)

No comment markers needed - AST finds structure by code patterns.

### Testing

**Unit tests:** Test individual transformation functions
**Integration tests:** Test full create-payload-app flows

Run tests: `pnpm --filter create-payload-app test`
