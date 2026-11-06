# Installation Note

There is currently a Corepack signature verification issue preventing `pnpm` from working properly.
This is a known issue with Corepack in some environments.

## Workaround

You can install dependencies using npm instead:

```bash
cd examples/secure-uploads
npm install --legacy-peer-deps
```

Or fix the Corepack issue first:

```bash
# Update Corepack
corepack disable
corepack enable

# Then try pnpm again
pnpm install
```

Once dependencies are installed, you can run:

```bash
pnpm dev
```
