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

### Package Management Flows

create-payload-app has two distinct flows for handling package installation:

#### Flow 1: `--init-next` (Next.js Integration)

```mermaid
sequenceDiagram
    participant CLI
    participant initNext
    participant FS as File System
    participant PM as Package Manager
    participant AST as AST Operations

    CLI->>initNext: --init-next with dbType
    initNext->>FS: Copy template files
    initNext->>PM: pnpm add payload @payloadcms/next @payloadcms/db-{type}
    PM->>FS: Install packages to node_modules
    initNext->>AST: configurePayloadConfig(filePath, {db})
    AST->>FS: Update payload.config.ts (imports/config)
    AST->>FS: Update package.json (dependencies)
    initNext->>CLI: ✓ Project ready
```

**Key points:**

- Uses `pnpm add` to install specific packages
- Packages installed before AST modifications
- No final `pnpm install` step

#### Flow 2: Template/Example Creation

```mermaid
sequenceDiagram
    participant CLI
    participant createProject
    participant FS as File System
    participant AST as AST Operations
    participant PM as Package Manager

    CLI->>createProject: --template with dbType
    createProject->>FS: Copy template/example files
    createProject->>AST: configurePayloadConfig(projectDir, {db})
    AST->>FS: Update payload.config.ts (imports/config)
    AST->>FS: Update package.json (dependencies)
    createProject->>PM: pnpm install
    PM->>FS: Install packages from package.json
    createProject->>CLI: ✓ Project ready
```

**Key points:**

- Updates package.json first
- Single `pnpm install` at end installs all dependencies
- Package manager resolves dependencies from package.json

**Package Operations:**

- **Install**: Runs actual `pnpm add` or `pnpm install` command (Flow 1 or Flow 2 respectively)
- **Package removal**: AST removes imports and updates package.json (orphaned packages cleaned up on next install)
- No explicit `pnpm remove` - package.json modifications only

### Testing

**Unit tests:** Test individual transformation functions
**Integration tests:** Test full create-payload-app flows

Run tests: `pnpm --filter create-payload-app test`
