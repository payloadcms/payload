# Triage

Modified version of https://github.com/balazsorban44/nissuer

## Modifications

- Port to TypeScript
- Remove issue locking
- Remove reproduction blocklist
- Uses `@vercel/ncc` for packaging

## Development

> [!IMPORTANT]
> Whenever a modification is made to the action, the action built to `dist` must be committed to the repository.

This is done by running:

```sh
pnpm build
```
