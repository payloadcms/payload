# Plan: Fix Payload CMS for Next.js 16 Compatibility

**Created**: January 16, 2026  
**Analysis Method**: Source code walkthrough of Payload CMS 3.71.1 compiled output

---

## 🎯 Goal

Make Payload CMS 3.71.1 work with Next.js 16.1.2 in the `ruya-web0` monorepo.

---

## 📋 Issues Found (3 Total)

### Issue #1: Route Handler Type Signature ❌ HIGH PRIORITY

**File**: `@payloadcms/next/dist/routes/rest/index.d.ts`

**Problem**: Curried function signature doesn't match Next.js 16 expectations

**Current (WRONG)**:

```typescript
export const OPTIONS: (config) => (request, args) => Promise<Response>
```

**Expected by Next.js 16**:

```typescript
export const OPTIONS: (request: NextRequest, context) => Promise<Response>
```

**Runtime code is CORRECT** (already uses `await args.params`), only TypeScript types are wrong!

**Impact**: TypeScript compilation fails

---

### Issue #2: React Context Initialization ❌ CRITICAL

**File**: `@payloadcms/ui/dist/providers/Config/index.js`

**Problem**: `PageConfigProvider` calls `useConfig()` which uses `use(RootConfigContext)`, but context is `undefined` in Next.js 16

**Code**:

```javascript
const RootConfigContext = createContext(undefined)
export const useConfig = () => use(RootConfigContext) // Returns undefined!

export const PageConfigProvider = ({ config }) => {
  const { config: rootConfig } = useConfig() // ❌ FAILS: can't destructure undefined
  // ...
}
```

**Why**: Next.js 16 has different rendering lifecycle - `PageConfigProvider` renders before `RootConfigContext.Provider` is mounted

**Impact**: Admin UI completely broken (TypeError)

---

### Issue #3: React Compiler (\_c function) ⚠️ UNKNOWN

**Files**: Multiple UI components

**Observation**: Payload uses React's experimental compiler (`import { c as _c } from "react/compiler-runtime"`)

**Status**: Might have compatibility issues with Turbopack/Next.js 16, needs testing

---

## 🔧 Fix Options

### Option A: Workaround (User-Side) - IMMEDIATE

**What**: Patch our route file to wrap Payload handlers

**File to modify**: `dev/tests/nextjs16-payload-test/src/app/api/[[...slug]]/route.ts`

**Changes**:

```typescript
// Current (fails TypeScript)
export const GET = REST_GET(config)

// Fixed (wraps to match Next.js 16)
export const GET = async (req: NextRequest, ctx) => REST_GET(config)(req, ctx)
```

**Pros**:

- ✅ Can do immediately
- ✅ Fixes TypeScript compilation
- ✅ Runtime already works

**Cons**:

- ❌ Doesn't fix admin UI context issue
- ❌ Workaround in our code

**Verdict**: Do this first to test if it helps

---

### Option B: Patch Payload Packages - MEDIUM EFFORT

**What**: Use `patch-package` to modify `@payloadcms` node_modules

**Files to patch**:

1. `@payloadcms/next/dist/routes/rest/index.d.ts` - fix types
2. `@payloadcms/ui/dist/providers/Config/index.js` - add defensive checks

**Changes needed**:

**File 1** (TypeScript types):

```typescript
// Add proper Next.js 16 signatures
export const OPTIONS: (
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> },
) => Promise<Response>
```

**File 2** (Defensive context):

```javascript
export const PageConfigProvider = ({ children, config: configFromProps }) => {
  const rootContext = use(RootConfigContext)

  // Defensive: If no context, just render with props
  if (!rootContext) {
    return <ConfigProvider config={configFromProps}>{children}</ConfigProvider>
  }

  const { config: rootConfig, setConfig: setRootConfig } = rootContext
  // ... rest of logic
}
```

**Pros**:

- ✅ Could fix both issues
- ✅ Keeps changes in our repo
- ✅ Can test immediately

**Cons**:

- ❌ High maintenance (breaks on Payload updates)
- ❌ Modifying compiled code (brittle)
- ❌ Need to use patch-package

**Verdict**: Try if Option A doesn't fully work

--- (Rest of document remains the same as previous version)
