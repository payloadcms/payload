# @payloadcms/codemod

CLI for auto-migrating Payload projects across deprecations. Initial target: v3 -> v4.

## Usage

Run against your project root:

```bash
npx @payloadcms/codemod [path]
```

With no arguments, runs every registered transform against the current directory. Transforms are idempotent and no-op on code that doesn't match their pattern, so running the full set against a partially migrated project is safe.

### Flags

- `--transform <name>` — run a single transform by name.
- `--list` — print registered transforms.
- `--dry` — analyze only; write nothing.
- `--print` — print transformed sources to stdout instead of writing.

## How it works

The tool loads your project via [ts-morph](https://ts-morph.com/), using your `tsconfig.json` when present, otherwise globbing `**/*.{ts,tsx,js,jsx}` (excluding `node_modules`, `dist`, `.next`, `build`). Each registered transform is applied in order against the shared project; changes are saved at the end unless `--dry` or `--print` is passed.

## Transforms

- `migrate-hide-api-url` — migrates `admin.hideAPIURL: true` to `admin.components.views.edit.api.tab.condition: () => false` on collection and global configs.

## Contributing

To add a transform:

1. Create `src/transforms/<name>/` with `index.ts` exporting a `Transform`.
2. Add fixtures as `<case>.input.ts` and `<case>.output.ts` siblings of `index.ts`.
3. Add `index.test.ts` verifying both the fixture pair and idempotency (running the transform on the output produces the output unchanged).
4. Register in `src/registry.ts`.
5. Update the transform list in this README.

Ship the transform in the same PR as the deprecation it migrates.
