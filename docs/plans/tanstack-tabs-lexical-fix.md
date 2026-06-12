# TanStack Tabs and Lexical Editor Fix

## Executive Summary

Fix two rendering issues in the TanStack adapter: (1) document tabs (Edit/API/Versions/custom) are not rendered because DocumentHeader is never mounted, and (2) the Lexical rich text editor renders as null because the RSC entry point and serialization pipeline strip the component.

---

## Problem Analysis

### Issue 1: Document Tabs Not Rendered

**Root cause:** The Next.js adapter renders `DocumentHeader` (which contains `DocumentTabs`) server-side in [`packages/next/src/views/Document/index.tsx`](../../packages/next/src/views/Document/index.tsx) (lines 164-173):

```tsx
{
  data.showHeader && !drawerSlug && (
    <DocumentHeader
      AfterHeader={Description}
      collectionConfig={collectionConfig}
      globalConfig={globalConfig}
      permissions={permissions}
      renderComponent={RenderServerComponent}
      req={req}
    />
  )
}
```

The TanStack adapter's [`DocumentViewContent`](../../packages/tanstack-start/src/views/AdminView.tsx) (lines 229-286) goes directly to `DefaultEditView` without any `DocumentHeader`. Tabs simply never appear.

**Challenge:** `DocumentHeader` requires `req: PayloadRequest` (server-only), `collectionConfig`, `globalConfig`, `permissions`, and `renderComponent`. These must either be serialized from the server or the tabs must be built from data already available on the client.

**Proposed solution:** `DocumentTabs` calls `getTabs()` which only needs `collectionConfig` and `globalConfig` (sanitized config). The tab data (labels, hrefs, conditions) can be pre-computed on the server in `getAdminPageData` and serialized as part of `SerializableDocumentViewData`. Then a new client-side `DocumentHeaderClient` component in `AdminView.tsx` renders the tabs from this pre-computed data.

Alternatively, the simpler approach: the client-side `DefaultEditView` already has access to `collectionConfig` and `globalConfig` via `useConfig().getEntityConfig()`. We can render a client-only `DocumentHeader` variant that:

1. Uses `getTabs()` with config from context (already client-available)
2. Uses `RenderClientComponent` for any custom tab components
3. Gets `permissions` from the auth context (already hydrated)

The cleanest approach is to add tab rendering to the TanStack `DocumentViewContent` in `AdminView.tsx`, serializing the necessary tab data alongside `documentData`.

---

### Issue 2: Lexical Editor Not Rendered

**Root cause (multi-layered):**

1. **Initial render:** `toSerializableFormState()` in [`buildDocumentViewClientProps.tsx`](../../packages/ui/src/views/Document/buildDocumentViewClientProps.tsx) strips `customComponents` from every field state before serializing to the client. The rich text field's `customComponents.Field` (which contains the rendered Lexical editor) is removed.

2. **Fallback returns null:** When `customComponents.Field` is undefined, [`RenderField.tsx`](../../packages/ui/src/forms/RenderFields/RenderField.tsx) falls through to the switch statement for `richText`, which renders [`@payloadcms/ui RichTextField`](../../packages/ui/src/fields/RichText/index.tsx) -- a **stub that returns `null`**.

3. **Server function rebuild can't help:** When the form calls `getFormState` via server function, `buildFormState` runs with `RenderClientComponent`. This tries to render `RscEntryLexicalField` (an async RSC) without `serverProps` (where `sanitizedEditorConfig` lives). Even if it produced a React element, it can't be serialized back to the client (React elements contain `Symbol(react.element)` which JSON/seroval can't handle).

4. **The RSC entry is fundamentally incompatible:** `RscEntryLexicalField` is `async`, needs `sanitizedEditorConfig` from serverProps, and calls server-side functions like `initLexicalFeatures`. None of this works through `RenderClientComponent`.

**Proposed solution:** Create a client-safe Lexical field entry point that bypasses the RSC layer:

- The client `RichTextField` from `@payloadcms/richtext-lexical/src/field/index.tsx` already handles lazy loading the editor, building client editor config, and rendering `LexicalProvider`. It just needs `sanitizedEditorConfig` as a prop.
- On the server side during `getAdminPageData`, the `sanitizedEditorConfig` for each richText field can be extracted from `fieldConfig.editor.editorConfig` and included in the serializable form state (as a JSON-safe config object, not a React element).
- The `RichTextField` stub in `@payloadcms/ui/src/fields/RichText/index.tsx` should be enhanced (or a new client entry created in `richtext-lexical`) to render the Lexical editor when the editor config is available from the field schema, without requiring the RSC entry point.

The most pragmatic approach:

- Add `editorConfig` to the serializable field state for richText fields (it's already available as `fieldConfig.editor.editorConfig`)
- Modify the `RichTextField` fallback in `@payloadcms/ui` (or the `RenderField` switch case for `richText`) to pass the editor config to the Lexical client component from `@payloadcms/richtext-lexical/client`
- OR: have `RenderClientComponent` resolve `RscEntryLexicalField` to the **client** `RichTextField` instead, passing editorConfig from the client field schema

---

## Key Files

### Tabs

| File                                                                | Role                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/next/src/views/Document/index.tsx`                        | Next.js adapter renders `DocumentHeader` with tabs (lines 164-173)     |
| `packages/ui/src/elements/DocumentHeader/index.tsx`                 | `DocumentHeader` component -- renders title + `DocumentTabs`           |
| `packages/ui/src/elements/DocumentHeader/Tabs/index.tsx`            | `DocumentTabs` -- calls `getTabs()`, renders tab list                  |
| `packages/ui/src/elements/DocumentHeader/Tabs/tabs/index.tsx`       | `getTabs()` -- builds Edit/Versions/API tabs + custom tabs from config |
| `packages/ui/src/elements/DocumentHeader/Tabs/ShouldRenderTabs.tsx` | Hides tabs on create (no id)                                           |
| `packages/ui/src/elements/DocumentHeader/Tabs/Tab/TabLink.tsx`      | `DocumentTabLink` -- client component using router adapter hooks       |
| `packages/tanstack-start/src/views/AdminView.tsx`                   | TanStack `DocumentViewContent` -- **missing** `DocumentHeader`         |

### Lexical

| File                                                              | Role                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/richtext-lexical/src/index.ts`                          | Registers `FieldComponent: '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField'`   |
| `packages/richtext-lexical/src/field/rscEntry.tsx`                | `RscEntryLexicalField` -- async RSC, needs `sanitizedEditorConfig` from serverProps   |
| `packages/richtext-lexical/src/field/index.tsx`                   | Client `RichTextField` -- lazy loads editor, needs `sanitizedEditorConfig` as prop    |
| `packages/richtext-lexical/src/field/Field.tsx`                   | `RichText` -- actual editor with `LexicalProvider`                                    |
| `packages/ui/src/fields/RichText/index.tsx`                       | **Stub** that returns `null` -- fallback when `customComponents.Field` is missing     |
| `packages/ui/src/forms/RenderFields/RenderField.tsx`              | Field renderer -- checks `customComponents.Field`, falls through to stub for richText |
| `packages/ui/src/views/Document/buildDocumentViewClientProps.tsx` | `toSerializableFormState()` -- strips `customComponents`                              |
| `packages/ui/src/elements/RenderServerComponent/clientOnly.tsx`   | `RenderClientComponent` -- ignores `serverProps`, only passes `clientProps`           |
| `packages/ui/src/forms/fieldSchemasToFormState/renderField.tsx`   | Creates `customComponents.Field` for richText with `renderComponent`                  |

### Import Map

| File                                                                       | Role                                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `tanstack-app/src/importMap.js`                                            | Generated import map -- includes RSC and client Lexical entries |
| `packages/payload/src/bin/generateImportMap/utilities/getFromImportMap.ts` | Runtime resolution of import map keys                           |
| `packages/richtext-lexical/src/utilities/generateImportMap.tsx`            | Adds Lexical entries to import map                              |

---

## Implementation Plan

### Step 1: Serialize Document Header/Tab Data

In [`packages/tanstack-start/src/views/Root/index.tsx`](../../packages/tanstack-start/src/views/Root/index.tsx), add to `SerializableDocumentViewData`:

- `showHeader` (already present)
- `collectionSlug` and `globalSlug` (already present)

`getTabs()` only needs `collectionConfig` and `globalConfig`, which are already available on the client via `useConfig().getEntityConfig()`. The `DocumentTabs` component needs `req` for `condition` evaluation and the import map -- the conditions can be evaluated server-side and included as boolean flags.

### Step 2: Render DocumentHeader in TanStack AdminView

In [`packages/tanstack-start/src/views/AdminView.tsx`](../../packages/tanstack-start/src/views/AdminView.tsx) `DocumentViewContent`, add `DocumentHeader` (or a client-only equivalent) before `DefaultEditView`. The component needs:

- `collectionConfig` / `globalConfig` from client config context
- `permissions` from auth context (already hydrated via `HydrateAuthProvider`)
- `renderComponent: RenderClientComponent` (for custom tab components)
- `req` -- this is the blocker; `DocumentHeader` expects `PayloadRequest`

**Approach A (recommended):** Create a `DocumentHeaderClient` component that builds tabs using `getTabs()` with client-available config, evaluates conditions client-side using hooks, and renders `DefaultDocumentTab` links. This avoids needing `req` entirely.

**Approach B:** Pre-render tab HTML on the server as part of `getAdminPageData` and pass it as serializable data. More complex, less maintainable.

### Step 3: Fix Lexical Field Rendering

**Option A (recommended):** Modify the TanStack form state pipeline so richText fields include enough data for client-side rendering:

1. In `getAdminPageData`, after `buildFormState`, extract `sanitizedEditorConfig` for each richText field and attach it to the serializable field state as `richTextEditorConfig`
2. In `RenderField.tsx`, when `customComponents.Field` is undefined for a `richText` field, check if `richTextEditorConfig` is available in the field state and pass it to the `RichTextField` from `@payloadcms/richtext-lexical/client` instead of the null stub

**Option B:** Create a `ClientEntryLexicalField` in `@payloadcms/richtext-lexical/client` that wraps `RichTextField` with client-side `initLexicalFeatures`, add it to the import map, and have the TanStack adapter use this component path instead of the RSC entry.

**Option C:** Modify the `@payloadcms/ui` `RichTextField` stub to be a real component that uses the import map to resolve and render the richtext adapter's client field component, pulling config from the client field schema.

---

## E2E Tests to Validate Fixes

### Tab rendering tests (from `test/admin/e2e/document-view/e2e.spec.ts`)

These tests should be run with `PAYLOAD_FRAMEWORK=tanstack-start` (or against the TanStack dev server):

- **"collection -- should not show API tab when disabled in config"** (line 124) -- verifies `.doc-tabs__tabs-container` exists and conditionally hides API tab
- **"global -- should not show API tab when disabled in config"** (line 160) -- same for globals
- **"collection -- should show api as first tab"** (line 807) -- verifies tab order and presence using `.doc-tabs__tabs-container .doc-tab`
- **"collection -- should show edit as third tab"** (line 813) -- verifies Edit tab presence
- **Custom edit label test** (line 319) -- verifies `.doc-tab:has-text("${customEditLabel}")` is visible, confirming custom tab label rendering

**Key selector to check:** `.doc-tabs` (the tab bar container) should be present on any existing document edit page.

### Lexical editor tests (from `test/lexical/collections/Lexical/e2e/main/e2e.spec.ts`)

- **Basic editor visibility** -- navigate to a lexical-fields document and verify `.rich-text-lexical` editor container is visible
- **Type and save** -- type text into the editor and save, confirming the editor is interactive
- **Bold/italic formatting** -- applies formatting and verifies it works (tests feature client components from the import map)

### Quick smoke test sequence

1. Navigate to a Posts document edit page
2. Assert `.doc-tabs` container is visible
3. Assert `.doc-tab` elements include "Edit" and "API" text
4. Assert `.rich-text-lexical` editor container is visible
5. Click into the editor, type text, verify it appears
6. Save the document

### Relevant test commands

```bash
# Run admin E2E with document view tests
PAYLOAD_TEST_SUITE=admin pnpm run test:e2e admin/e2e/document-view

# Run lexical E2E tests
PAYLOAD_TEST_SUITE=lexical pnpm run test:e2e lexical/collections/Lexical/e2e/main
```

For TanStack specifically, these need the TanStack dev server running instead of the Next.js one.
