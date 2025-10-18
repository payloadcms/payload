# TypeScript JSDoc Inheritance Plugin

A TypeScript Language Service Plugin that enables documentation inheritance via `@inheritDoc` tag.

## Usage

1. Build the plugin:

```bash
cd tools/ts-plugin-inherit-doc
pnpm install
pnpm build
```

2. Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@payloadcms/ts-plugin-inherit-doc" }]
  }
}
```

3. Use in your code:

```javascript
/**
 * Represents a user in the system
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} name - User's full name
 */

/**
 * @typedef {Object} UserResponse
 * @property {User} user - @inheritDoc User
 * @property {string} token - Auth token
 */
```

When you hover over `user` property, you'll see the inherited documentation from `User`.

## Notes

- The plugin rebuilds the documentation cache on each hover (optimization needed for production)
- Only works with `@typedef` JSDoc declarations
- VSCode requires TypeScript workspace version to use plugins
