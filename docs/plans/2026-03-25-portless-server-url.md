# Portless Server URL Migration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all hardcoded `localhost:3000` references in the monorepo's test infrastructure with a single `serverURL` helper that reads `process.env.PORTLESS_URL`, set automatically by portless.

**Architecture:** A single shared helper (`test/__helpers/shared/serverURL.ts`) exports `serverURL` from `process.env.PORTLESS_URL`. All test infra, configs, and fixtures import from it. Client-side components switch to relative URLs. The `pnpm dev` scripts already wrap commands with `portless payload-monorepo`, which sets `PORTLESS_URL=http://payload-monorepo.localhost:1355`.

**Tech Stack:** TypeScript, Vitest, Playwright, Next.js, portless

---

### Task 1: Create the shared serverURL helper

**Files:**

- Create: `test/__helpers/shared/serverURL.ts`

**Step 1: Create the helper file**

```ts
export const serverURL: string = process.env.PORTLESS_URL
```

**Step 2: Commit**

```bash
git add test/__helpers/shared/serverURL.ts
git commit -m "feat: add shared serverURL helper reading PORTLESS_URL"
```

---

### Task 2: Update test infrastructure entry points

**Files:**

- Modify: `test/__helpers/shared/initPayloadE2ENoConfig.ts`
- Modify: `test/__helpers/shared/NextRESTClient.ts:82`
- Modify: `test/__helpers/shared/getSDK.ts:24`
- Modify: `test/dev.ts:81`

**Step 1: Update `initPayloadE2ENoConfig.ts`**

Replace lines 29-33:

```ts
const port = 3000
process.env.PORT = String(port)
process.env.PAYLOAD_CI_DEPENDENCY_CHECKER = 'true'

const serverURL = `http://localhost:${port}`
```

With:

```ts
process.env.PAYLOAD_CI_DEPENDENCY_CHECKER = 'true'

const { serverURL } = await import('./serverURL.js')
```

Remove the unused `port` variable entirely. Do NOT set `process.env.PORT` — portless handles port assignment.

**Step 2: Update `NextRESTClient.ts`**

Replace line 82:

```ts
serverURL: string = 'http://localhost:3000'
```

With:

```ts
serverURL: string = process.env.PORTLESS_URL
```

Note: This file cannot import from `serverURL.ts` because it's a class field default. Use `process.env.PORTLESS_URL` directly here — this is the ONE exception. The config override on line 86-88 still takes precedence.

**Step 3: Update `getSDK.ts`**

Replace line 24:

```ts
const url = `${config.serverURL || 'http://localhost:3000'}${config.routes.api}/${slugs}${search ? `?${search}` : ''}`
```

With:

```ts
const url = `${config.serverURL || process.env.PORTLESS_URL}${config.routes.api}/${slugs}${search ? `?${search}` : ''}`
```

Same exception as NextRESTClient — inline env read is acceptable since these are fallback defaults.

**Step 4: Update `dev.ts`**

Replace line 81:

```ts
await open(`http://localhost:3000${adminRoute}`)
```

With:

```ts
await open(`${process.env.PORTLESS_URL}${adminRoute}`)
```

This runs inside the portless child process where `PORTLESS_URL` is set.

**Step 5: Commit**

```bash
git add test/__helpers/shared/initPayloadE2ENoConfig.ts test/__helpers/shared/NextRESTClient.ts test/__helpers/shared/getSDK.ts test/dev.ts
git commit -m "feat: update test infra to use PORTLESS_URL instead of localhost:3000"
```

---

### Task 3: Update `runE2E.ts` server detection

**Files:**

- Modify: `test/runE2E.ts:164-174`

**Step 1: Replace TCP port check with HTTP fetch to portless URL**

Replace lines 1 and 4 (imports):

```ts
import { spawn } from 'child_process'
...
import { createServer } from 'net'
```

With:

```ts
import { spawn } from 'child_process'
...
```

Remove the `createServer` import from `'net'` (no longer needed).

Replace lines 162-183:

```ts
process.env.START_MEMORY_DB = 'true'

const portInUse = await new Promise<boolean>((resolve) => {
  const server = createServer()
  server.once('error', () => resolve(true))
  server.once('listening', () => server.close(() => resolve(false)))
  server.listen(3000)
})

let child: ReturnType<typeof spawn> | undefined

if (portInUse) {
  console.log('Port 3000 is already in use — reusing existing dev server.')
} else {
  child = spawn('pnpm', spawnDevArgs, {
    cwd: path.resolve(dirname, '..'),
    env: {
      ...process.env,
    },
    stdio: 'inherit',
  })
}
```

With:

```ts
process.env.START_MEMORY_DB = 'true'

const serverURL = process.env.PORTLESS_URL

const serverAlreadyRunning = await fetch(serverURL)
  .then(() => true)
  .catch(() => false)

let child: ReturnType<typeof spawn> | undefined

if (serverAlreadyRunning) {
  console.log(`Dev server already running at ${serverURL} — reusing.`)
} else {
  child = spawn('pnpm', spawnDevArgs, {
    cwd: path.resolve(dirname, '..'),
    env: {
      ...process.env,
    },
    stdio: 'inherit',
  })
}
```

**Step 2: Commit**

```bash
git add test/runE2E.ts
git commit -m "feat: check portless URL instead of port 3000 in E2E runner"
```

---

### Task 4: Update test configs — cors/csrf arrays

These configs use `localhost:3000` in cors/csrf arrays. Import `serverURL` and use it.

**Files:**

- Modify: `test/admin-root/config.ts:34`
- Modify: `test/sort/config.ts:46`
- Modify: `test/live-preview/config.ts:57-58`
- Modify: `test/lexical-mdx/config.ts:35`
- Modify: `test/select/getConfig.ts:123`

**Step 1: For each file, add import and replace cors/csrf arrays**

Add import at top of each file:

```ts
import { serverURL } from '../__helpers/shared/serverURL.js'
```

Replace cors arrays like:

```ts
cors: ['http://localhost:3000', 'http://localhost:3001'],
```

With:

```ts
cors: [serverURL, 'http://localhost:3001'],
```

Do the same for csrf arrays in `live-preview/config.ts`.

Note: Adjust the relative import path per file depth. For `select/getConfig.ts` it's `../__helpers/shared/serverURL.js`. For `admin-root/config.ts` it's also `../__helpers/shared/serverURL.js`.

**Step 2: Commit**

```bash
git add test/admin-root/config.ts test/sort/config.ts test/live-preview/config.ts test/lexical-mdx/config.ts test/select/getConfig.ts
git commit -m "feat: use serverURL helper in test config cors/csrf arrays"
```

---

### Task 5: Update test configs — serverURL and livePreview properties

**Files:**

- Modify: `test/base-path/config.ts:18`
- Modify: `test/server-url/config.ts:12`
- Modify: `test/admin/config.ts:157`
- Modify: `test/live-preview/collections/CollectionLevelConfig.ts:11`

**Step 1: For each file, add import and replace**

Add import:

```ts
import { serverURL } from '../__helpers/shared/serverURL.js'
```

Replace:

- `test/base-path/config.ts:18`: `serverURL: 'http://localhost:3000'` -> `serverURL,`
- `test/server-url/config.ts:12`: `serverURL: 'http://localhost:3000'` -> `serverURL,`
- `test/admin/config.ts:157`: `url: 'http://localhost:3000'` -> `url: serverURL`
- `test/live-preview/collections/CollectionLevelConfig.ts:11`: `url: 'http://localhost:3000/live-preview'` -> `` url: `${serverURL}/live-preview` ``

Adjust relative import paths per file depth.

**Step 2: Commit**

```bash
git add test/base-path/config.ts test/server-url/config.ts test/admin/config.ts test/live-preview/collections/CollectionLevelConfig.ts
git commit -m "feat: use serverURL helper in test config serverURL and livePreview properties"
```

---

### Task 6: Update live-preview test files

**Files:**

- Modify: `test/live-preview/app/live-preview/_api/serverURL.ts:1`
- Modify: `test/live-preview/prod/app/live-preview/_api/serverURL.ts:1`
- Modify: `test/live-preview/seed/tenant-1.ts:5`
- Modify: `test/live-preview/int.spec.ts:43,83`

**Step 1: Update the two `_api/serverURL.ts` files**

Both files currently export:

```ts
export const PAYLOAD_SERVER_URL = 'http://localhost:3000'
```

Replace with:

```ts
export const PAYLOAD_SERVER_URL = process.env.PORTLESS_URL
```

These are Next.js server-side files (inside `app/`), so `process.env` is available.

**Step 2: Update `live-preview/seed/tenant-1.ts`**

Add import:

```ts
import { serverURL } from '../__helpers/shared/serverURL.js'
```

Replace line 5:

```ts
clientURL: 'http://localhost:3000',
```

With:

```ts
clientURL: serverURL,
```

Adjust import path: `../../__helpers/shared/serverURL.js`

**Step 3: Update `live-preview/int.spec.ts`**

Add import:

```ts
import { serverURL } from '../__helpers/shared/serverURL.js'
```

Remove line 43:

```ts
const serverURL: string = 'http://localhost:3000'
```

The imported `serverURL` replaces it.

Replace line 83:

```ts
clientURL: 'http://localhost:3000',
```

With:

```ts
clientURL: serverURL,
```

**Step 4: Commit**

```bash
git add test/live-preview/
git commit -m "feat: use serverURL helper in live-preview test files"
```

---

### Task 7: Update client-side components to use relative URLs

These are `'use client'` React components. They cannot access `process.env` at runtime. Use relative URLs instead — these fetch calls target the same origin.

**Files:**

- Modify: `test/plugin-sentry/TestErrors.tsx:9,15,24,34,44,58`
- Modify: `test/plugin-ecommerce/app/components/CheckoutStripe.tsx:22`
- Modify: `test/admin-bar/app/admin-bar/layout.tsx:20`

**Step 1: Update `TestErrors.tsx`**

Replace all 6 occurrences of `http://localhost:3000` with empty string (making paths relative):

- `'http://localhost:3000/api/users/notFound'` -> `'/api/users/notFound'`
- `'http://localhost:3000/api/posts'` -> `'/api/posts'`
- `'http://localhost:3000/api/users/login'` -> `'/api/users/login'`
- `'http://localhost:3000/api/users/forgot-password'` -> `'/api/users/forgot-password'`
- `'http://localhost:3000/api/users/reset-password'` -> `'/api/users/reset-password'`
- `'http://localhost:3000/api/users/unlock'` -> `'/api/users/unlock'`

**Step 2: Update `CheckoutStripe.tsx`**

Replace line 22:

```ts
return_url: 'http://localhost:3000/shop/confirm-order',
```

With:

```ts
return_url: `${window.location.origin}/shop/confirm-order`,
```

Stripe's `return_url` requires an absolute URL, so use `window.location.origin`.

**Step 3: Update `admin-bar/layout.tsx`**

This is a server component (no `'use client'`). Replace line 20:

```tsx
cmsURL = 'http://localhost:3000'
```

With:

```tsx
cmsURL={process.env.PORTLESS_URL}
```

**Step 4: Commit**

```bash
git add test/plugin-sentry/TestErrors.tsx test/plugin-ecommerce/app/components/CheckoutStripe.tsx test/admin-bar/app/admin-bar/layout.tsx
git commit -m "feat: use relative URLs and PORTLESS_URL in client/server test components"
```

---

### Task 8: Update E2E spec files with hardcoded URLs

**Files:**

- Modify: `test/lexical/collections/Lexical/e2e/main/e2e.spec.ts:1458,1494`
- Modify: `test/lexical/collections/Lexical/e2e/blocks/e2e.spec.ts:1277,1329,1491`

**Step 1: Add import to both spec files**

```ts
import { serverURL } from '../../../../__helpers/shared/serverURL.js'
```

**Step 2: Replace hardcoded URLs**

In `main/e2e.spec.ts`:

- Line 1458: `'http://localhost:3000/admin/collections/rich-text-fields?limit=10'` -> `` `${serverURL}/admin/collections/rich-text-fields?limit=10` ``
- Line 1494: `'http://localhost:3000/admin/collections/LexicalInBlock?limit=10'` -> `` `${serverURL}/admin/collections/LexicalInBlock?limit=10` ``

In `blocks/e2e.spec.ts`:

- Lines 1277, 1329, 1491: same pattern, replace `'http://localhost:3000/admin/collections/LexicalInBlock?limit=10'` -> `` `${serverURL}/admin/collections/LexicalInBlock?limit=10` ``

**Step 3: Commit**

```bash
git add test/lexical/collections/Lexical/e2e/main/e2e.spec.ts test/lexical/collections/Lexical/e2e/blocks/e2e.spec.ts
git commit -m "feat: use serverURL helper in lexical E2E specs"
```

---

### Task 9: Update remaining files

**Files:**

- Modify: `test/field-error-states/collections/PrevValue/index.ts:37`
- Modify: `test/plugin-cloud-storage/.env.emulated:3`
- Modify: `test/plugin-import-export/.env.emulated:3`
- Modify: `test/uploads/config.ts:787` (comment only)

**Step 1: Update `field-error-states/collections/PrevValue/index.ts`**

This is a server-side collection hook. Add import:

```ts
import { serverURL } from '../../../../__helpers/shared/serverURL.js'
```

Replace line 37:

```ts
`http://localhost:3000/api/${collectionSlugs.prevValueRelation}${query}`,
```

With:

```ts
`${serverURL}/api/${collectionSlugs.prevValueRelation}${query}`,
```

Adjust import path based on file depth: `../../../__helpers/shared/serverURL.js`

**Step 2: Update `.env.emulated` files**

In `test/plugin-cloud-storage/.env.emulated` and `test/plugin-import-export/.env.emulated`, replace:

```
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

With:

```
PAYLOAD_PUBLIC_SERVER_URL=http://payload-monorepo.localhost:1355
```

These are env files that can't import JS — hardcode the URL here. This is acceptable since they're test fixtures, not production code.

**Step 3: Update comment in `uploads/config.ts`**

Replace line 787's comment reference from `http://localhost:3000/media` to `http://payload-monorepo.localhost:1355/media`.

**Step 4: Commit**

```bash
git add test/field-error-states/collections/PrevValue/index.ts test/plugin-cloud-storage/.env.emulated test/plugin-import-export/.env.emulated test/uploads/config.ts
git commit -m "feat: replace remaining localhost:3000 references with portless URL"
```

---

### Task 10: Verify no remaining localhost:3000 in test/

**Step 1: Search for remaining references**

Run:

```bash
grep -r "localhost:3000" test/ --include="*.ts" --include="*.tsx" --include="*.env*" -l
```

Expected: no results.

**Step 2: Verify the dev server starts and PORTLESS_URL is set**

Run:

```bash
pnpm dev _community
```

Verify output shows `PORTLESS_URL=http://payload-monorepo.localhost:1355`.

**Step 3: Final commit if any fixups needed**
