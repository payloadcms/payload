# Bulk Upload Error Count Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix bulk upload error counting to accurately include file-related errors (missing file, file too large) alongside field validation errors.

**Architecture:** Add explicit boolean flags (`missingFile`, `exceedsLimit`) to form state, then calculate total `errorCount` as the sum of field validation errors plus file error flags. This ensures the UI displays accurate error counts and maintains state clarity.

**Tech Stack:** React, TypeScript, Vitest for testing

---

## Task 1: Update Form State Type Definition

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/reducer.ts:9-14`

**Step 1: Add file error flags to form type**

Update the form object type in the `State` interface:

```typescript
forms: {
  errorCount: number
  exceedsLimit: boolean
  formID: string
  formState: FormState
  missingFile: boolean
  uploadEdits?: UploadEdits
}[]
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds (or shows expected errors in components that need updating)

**Step 3: Commit type definition changes**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/reducer.ts
git commit -m "feat(ui): add file error flags to bulk upload form state"
```

---

## Task 2: Initialize File Error Flags in ADD_FORMS Reducer

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/reducer.ts:51-74`

**Step 1: Add flag initialization in ADD_FORMS case**

Update the form creation in the `ADD_FORMS` case:

```typescript
case 'ADD_FORMS': {
  const newForms: State['forms'] = []
  for (let i = 0; i < action.forms.length; i++) {
    newForms[i] = {
      errorCount: 0,
      exceedsLimit: false,
      formID: action.forms[i].formID ?? (crypto.randomUUID ? crypto.randomUUID() : uuidv4()),
      formState: {
        ...(action.forms[i].initialState || {}),
        file: {
          initialValue: action.forms[i].file,
          valid: true,
          value: action.forms[i].file,
        },
      },
      missingFile: false,
      uploadEdits: {},
    }
  }

  return {
    ...state,
    activeIndex: 0,
    forms: [...newForms, ...state.forms],
  }
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit reducer initialization**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/reducer.ts
git commit -m "feat(ui): initialize file error flags in bulk upload forms"
```

---

## Task 3: Update UPDATE_FORM Reducer to Preserve Flags

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/reducer.ts:117-139`

**Step 1: Extend UPDATE_FORM action type**

Update the `Action` type union to include optional file error flags:

```typescript
| {
    errorCount: number
    exceedsLimit?: boolean
    formState: FormState
    index: number
    missingFile?: boolean
    type: 'UPDATE_FORM'
    updatedFields?: Record<string, unknown>
    uploadEdits?: UploadEdits
  }
```

**Step 2: Update UPDATE_FORM case to handle flags**

Modify the `UPDATE_FORM` case:

```typescript
case 'UPDATE_FORM': {
  const updatedForms = [...state.forms]
  updatedForms[action.index].errorCount = action.errorCount

  // Update file error flags if provided, otherwise preserve existing values
  if (action.exceedsLimit !== undefined) {
    updatedForms[action.index].exceedsLimit = action.exceedsLimit
  }
  if (action.missingFile !== undefined) {
    updatedForms[action.index].missingFile = action.missingFile
  }

  // Merge the existing formState with the new formState
  updatedForms[action.index] = {
    ...updatedForms[action.index],
    formState: {
      ...updatedForms[action.index].formState,
      ...action.formState,
    },
    uploadEdits: {
      ...updatedForms[action.index].uploadEdits,
      ...action.uploadEdits,
    },
  }

  return {
    ...state,
    forms: updatedForms,
    totalErrorCount: updatedForms.reduce((acc, form) => acc + form.errorCount, 0),
  }
}
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 4: Commit reducer update logic**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/reducer.ts
git commit -m "feat(ui): preserve file error flags in UPDATE_FORM reducer"
```

---

## Task 4: Update REPLACE Reducer to Handle Flags

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/reducer.ts:95-100`

**Step 1: Ensure REPLACE preserves type safety**

The `REPLACE` case uses `Partial<State>` which already handles the new flags correctly. Verify no changes needed:

```typescript
case 'REPLACE': {
  return {
    ...state,
    ...action.state,
  }
}
```

This case already works correctly because it spreads `action.state` which can include forms with the new flags.

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors (no changes needed for this case)

**Step 3: Skip commit** (no changes needed)

---

## Task 5: Update FormsManagerContext Type

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:35-64`

**Step 1: Verify context type matches new form structure**

The `FormsManagerContext` type references `State['forms']` which now includes the new flags. Verify the context default value:

```typescript
const Context = React.createContext<FormsManagerContext>({
  activeIndex: 0,
  addFiles: () => Promise.resolve(),
  bulkUpdateForm: () => null,
  collectionSlug: '',
  docPermissions: undefined,
  documentSlots: {},
  forms: [],
  getFormDataRef: { current: () => ({}) },
  hasPublishPermission: false,
  hasSavePermission: false,
  hasSubmitted: false,
  isInitializing: false,
  removeFile: () => {},
  saveAllDocs: () => Promise.resolve(),
  setActiveIndex: () => 0,
  setFormTotalErrorCount: () => {},
  totalErrorCount: 0,
  updateUploadEdits: () => {},
})
```

The `forms: []` default is fine because empty arrays don't need the new properties.

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors (no changes needed)

**Step 3: Skip commit** (no changes needed)

---

## Task 6: Fix Error Calculation in saveAllDocs - Empty Filename Case

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:343-355`

**Step 1: Update empty filename error handling**

Replace the existing empty filename check with proper flag setting:

```typescript
// Skip upload if file is missing a filename
if (
  fileValue &&
  typeof fileValue === 'object' &&
  'name' in fileValue &&
  (!fileValue.name || fileValue.name === '')
) {
  currentForms[i] = {
    ...currentForms[i],
    errorCount: 1,
    exceedsLimit: false,
    missingFile: true,
  }
  continue
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit empty filename fix**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "fix(ui): set missingFile flag for empty filename in bulk upload"
```

---

## Task 7: Fix Error Calculation in saveAllDocs - Success Case

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:418-425`

**Step 1: Update success case form assignment**

After a successful upload or field validation, update the form with error flags:

```typescript
currentForms[i] = {
  errorCount: fieldErrors.length,
  exceedsLimit: false,
  formID: currentForms[i].formID,
  formState: fieldReducer(currentForms[i].formState, {
    type: 'ADD_SERVER_ERRORS',
    errors: fieldErrors,
  }),
  missingFile: false,
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit success case fix**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "fix(ui): reset file error flags on successful bulk upload validation"
```

---

## Task 8: Fix Error Calculation in saveAllDocs - File Error Cases

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:427-433`

**Step 1: Replace increment logic with proper flag-based calculation**

Replace the existing error increment logic:

```typescript
// Handle file-specific errors
const isMissingFile =
  req.status === 400 && !currentForms[i].formState.file?.value
const isFileTooLarge = req.status === 413

if (isMissingFile || isFileTooLarge) {
  const fileErrorCount = (isMissingFile ? 1 : 0) + (isFileTooLarge ? 1 : 0)

  currentForms[i] = {
    ...currentForms[i],
    errorCount: fieldErrors.length + fileErrorCount,
    exceedsLimit: isFileTooLarge,
    missingFile: isMissingFile,
  }

  toast.error(nonFieldErrors[0]?.message)
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit file error calculation fix**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "fix(ui): calculate error count with file error flags in bulk upload"
```

---

## Task 9: Remove Debug Console.log

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:435`

**Step 1: Remove debug logging**

Delete the console.log statement:

```typescript
// DELETE THIS LINE:
// console.log('currentForms[i]', currentForms[i], currentForms[i].formState)
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit cleanup**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "chore(ui): remove debug console.log from bulk upload"
```

---

## Task 10: Update setActiveIndex to Preserve File Error Flags

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:230-252`

**Step 1: Preserve flags when switching active form**

Update the `setActiveIndex` callback to preserve file error flags:

```typescript
const setActiveIndex: FormsManagerContext['setActiveIndex'] = React.useCallback(
  (index: number) => {
    const currentFormsData = getFormDataRef.current()
    dispatch({
      type: 'REPLACE',
      state: {
        activeIndex: index,
        forms: forms.map((form, i) => {
          if (i === activeIndex) {
            return {
              errorCount: form.errorCount,
              exceedsLimit: form.exceedsLimit,
              formID: form.formID,
              formState: currentFormsData,
              missingFile: form.missingFile,
              uploadEdits: form.uploadEdits,
            }
          }
          return form
        }),
      },
    })
  },
  [forms, activeIndex],
)
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit active index fix**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "fix(ui): preserve file error flags when changing active form"
```

---

## Task 11: Update addFiles to Preserve File Error Flags

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:254-280`

**Step 1: Preserve flags when adding files**

Update the `addFiles` callback to preserve file error flags:

```typescript
const addFiles = React.useCallback(
  async (files: FileList) => {
    if (forms.length) {
      // save the state of the current form before adding new files
      dispatch({
        type: 'UPDATE_FORM',
        errorCount: forms[activeIndex].errorCount,
        exceedsLimit: forms[activeIndex].exceedsLimit,
        formState: getFormDataRef.current(),
        index: activeIndex,
        missingFile: forms[activeIndex].missingFile,
      })
    }

    toggleLoadingOverlay({ isLoading: true, key: 'addingDocs' })
    if (!hasInitializedState) {
      await initializeSharedFormState()
    }
    dispatch({
      type: 'ADD_FORMS',
      forms: Array.from(files).map((file) => ({
        file,
        initialState: initialStateRef.current,
      })),
    })
    toggleLoadingOverlay({ isLoading: false, key: 'addingDocs' })
  },
  [
    initializeSharedFormState,
    hasInitializedState,
    toggleLoadingOverlay,
    activeIndex,
    forms,
  ],
)
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit add files fix**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "fix(ui): preserve file error flags when adding new bulk upload files"
```

---

## Task 12: Update bulkUpdateForm to Preserve File Error Flags

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:502-547`

**Step 1: Preserve flags in both dispatch calls**

Update the `bulkUpdateForm` callback:

```typescript
const bulkUpdateForm = React.useCallback(
  async (
    updatedFields: Record<string, unknown>,
    afterStateUpdate?: () => void,
  ) => {
    for (let i = 0; i < forms.length; i++) {
      Object.entries(updatedFields).forEach(([path, value]) => {
        if (forms[i].formState[path]) {
          forms[i].formState[path].value = value

          dispatch({
            type: 'UPDATE_FORM',
            errorCount: forms[i].errorCount,
            exceedsLimit: forms[i].exceedsLimit,
            formState: forms[i].formState,
            index: i,
            missingFile: forms[i].missingFile,
          })
        }
      })

      if (typeof afterStateUpdate === 'function') {
        afterStateUpdate()
      }

      if (hasSubmitted) {
        const { state } = await getFormState({
          collectionSlug,
          docPermissions,
          docPreferences: null,
          formState: forms[i].formState,
          operation: 'create',
          schemaPath: collectionSlug,
        })

        const newFormErrorCount = Object.values(state).reduce(
          (acc, value) => (value?.valid === false ? acc + 1 : acc),
          0,
        )

        dispatch({
          type: 'UPDATE_FORM',
          errorCount: newFormErrorCount,
          exceedsLimit: forms[i].exceedsLimit,
          formState: state,
          index: i,
          missingFile: forms[i].missingFile,
        })
      }
    }
  },
  [collectionSlug, docPermissions, forms, getFormState, hasSubmitted],
)
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit bulk update fix**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "fix(ui): preserve file error flags in bulk update form"
```

---

## Task 13: Update updateUploadEdits to Preserve File Error Flags

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:549-560`

**Step 1: Preserve flags when updating upload edits**

Update the `updateUploadEdits` callback:

```typescript
const updateUploadEdits = React.useCallback<
  FormsManagerContext['updateUploadEdits']
>(
  (uploadEdits) => {
    dispatch({
      type: 'UPDATE_FORM',
      errorCount: forms[activeIndex].errorCount,
      exceedsLimit: forms[activeIndex].exceedsLimit,
      formState: forms[activeIndex].formState,
      index: activeIndex,
      missingFile: forms[activeIndex].missingFile,
      uploadEdits,
    })
  },
  [activeIndex, forms],
)
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors

**Step 3: Commit upload edits fix**

```bash
git add packages/ui/src/elements/BulkUpload/FormsManager/index.tsx
git commit -m "fix(ui): preserve file error flags when updating upload edits"
```

---

## Task 14: Update resetUploadEdits to Preserve File Error Flags

**Files:**

- Modify: `packages/ui/src/elements/BulkUpload/FormsManager/index.tsx:562-572`

**Step 1: Preserve flags when resetting upload edits**

Update the `resetUploadEdits` callback:

```typescript
const resetUploadEdits = React.useCallback<
  FormsManagerContext['resetUploadEdits']
>(() => {
  dispatch({
    type: 'REPLACE',
    state: {
      forms: forms.map((form) => ({
        ...form,
        uploadEdits: {},
      })),
    },
  })
}, [forms])
```

This already preserves all form properties including the new flags via the spread operator.

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build:ui`

Expected: Build succeeds with no type errors (no changes needed)

**Step 3: Skip commit** (no changes needed)

---

## Task 15: Build and Verify All Changes

**Files:**

- All modified files

**Step 1: Clean build**

Run: `pnpm run build:core`

Expected: Build completes successfully with no errors

**Step 2: Run linter**

Run: `pnpm run lint:fix`

Expected: No linting errors

**Step 3: Verify git status**

Run: `git status`

Expected: All changes committed, working directory clean

**Step 4: Create final summary commit if needed**

If any uncommitted changes remain:

```bash
git add .
git commit -m "chore(ui): finalize bulk upload error count fix"
```

---

## Task 16: Manual Testing Plan

**Files:**

- N/A (manual testing)

**Test Case 1: Missing File Error**

1. Start dev server: `pnpm run dev uploads`
2. Navigate to bulk upload UI
3. Add a form but don't attach a file
4. Fill in required fields
5. Submit
6. Verify: Error count shows 1, form displays missing file indicator

**Test Case 2: File Too Large Error**

1. Create a file larger than the upload limit
2. Add form with this file
3. Fill in required fields correctly
4. Submit
5. Verify: Error count shows 1, form displays file size error

**Test Case 3: Combined Errors**

1. Add form with valid file
2. Leave one required field empty
3. Submit
4. Verify: Error count shows 1 (field error)
5. Remove the file
6. Submit again
7. Verify: Error count shows 2 (field error + missing file)

**Test Case 4: Error Recovery**

1. Add form with missing file (error count = 1)
2. Add a valid file
3. Submit
4. Verify: Error count becomes 0, upload succeeds

---

## Testing Notes

The existing test suite in `test/uploads/int.spec.ts` primarily tests the REST API layer, not the UI component error counting logic. UI-level testing would require:

1. Component tests using Vitest + React Testing Library
2. E2E tests using Playwright (already exists in `test/uploads/e2e.spec.ts`)

For now, manual testing is sufficient since this is a bug fix to existing functionality. If you want to add automated tests, they should be added after this plan is complete.

---

## Rollback Plan

If issues arise:

1. Revert commits in reverse order
2. Run: `pnpm run build:ui` to verify clean state
3. All changes are backwards-compatible since new properties are optional in UPDATE_FORM action
