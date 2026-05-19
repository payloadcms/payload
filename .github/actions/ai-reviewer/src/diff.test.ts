import { describe, expect, it } from 'vitest'
import { isIgnoredFile, parseChangedLineNumbers, splitDiffByFile } from './diff'

describe('splitDiffByFile', () => {
  it('should return an empty array for an empty diff', () => {
    expect(splitDiffByFile('')).toEqual([])
  })

  it('should parse a single-file diff', () => {
    const diff = `diff --git a/src/index.ts b/src/index.ts
index 1234567..abcdefg 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
+import foo from 'foo'
 export const x = 1`

    const result = splitDiffByFile(diff)

    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('src/index.ts')
    expect(result[0].diff).toContain('+import foo')
  })

  it('should split a multi-file diff into separate entries', () => {
    const diff = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1 +1,2 @@
+const a = 1
diff --git a/src/b.ts b/src/b.ts
index 3333333..4444444 100644
--- a/src/b.ts
+++ b/src/b.ts
@@ -1 +1,2 @@
+const b = 2`

    const result = splitDiffByFile(diff)

    expect(result).toHaveLength(2)
    expect(result[0].path).toBe('src/a.ts')
    expect(result[1].path).toBe('src/b.ts')
  })

  it('should exclude ignored files', () => {
    const diff = `diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
index 1111111..2222222 100644
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -1 +1 @@
-old
+new
diff --git a/src/index.ts b/src/index.ts
index 3333333..4444444 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1 +1 @@
+const x = 1`

    const result = splitDiffByFile(diff)

    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('src/index.ts')
  })
})

describe('parseChangedLineNumbers', () => {
  it('should include added lines as valid new-file line numbers', () => {
    const fileDiffs = [
      {
        path: 'src/foo.ts',
        diff: `diff --git a/src/foo.ts b/src/foo.ts
@@ -1,2 +1,3 @@
 const a = 1
+const b = 2
 const c = 3`,
      },
    ]

    const result = parseChangedLineNumbers(fileDiffs)

    expect(result.get('src/foo.ts')).toContain(2)
  })

  it('should include context lines as valid new-file line numbers', () => {
    const fileDiffs = [
      {
        path: 'src/foo.ts',
        diff: `diff --git a/src/foo.ts b/src/foo.ts
@@ -1,2 +1,3 @@
 const a = 1
+const b = 2
 const c = 3`,
      },
    ]

    const result = parseChangedLineNumbers(fileDiffs)

    expect(result.get('src/foo.ts')).toContain(1)
    expect(result.get('src/foo.ts')).toContain(3)
  })

  it('should not include removed lines as valid new-file line numbers', () => {
    const fileDiffs = [
      {
        path: 'src/foo.ts',
        diff: `diff --git a/src/foo.ts b/src/foo.ts
@@ -1,3 +1,2 @@
 const a = 1
-const b = 2
 const c = 3`,
      },
    ]

    const result = parseChangedLineNumbers(fileDiffs)

    const validLines = result.get('src/foo.ts')!

    expect(validLines).toContain(1)
    expect(validLines).toContain(2)
    expect(validLines.size).toBe(2)
  })

  it('should handle multi-hunk diffs with correct line numbers', () => {
    const fileDiffs = [
      {
        path: 'src/foo.ts',
        diff: `diff --git a/src/foo.ts b/src/foo.ts
@@ -1,3 +1,4 @@
 const a = 1
+const b = 2
 const c = 3
 const d = 4
@@ -10,3 +11,4 @@
 const e = 5
+const f = 6
 const g = 7`,
      },
    ]

    const result = parseChangedLineNumbers(fileDiffs)

    const validLines = result.get('src/foo.ts')!

    expect(validLines).toContain(2)
    expect(validLines).toContain(12)
  })

  it('should handle multiple files independently', () => {
    const fileDiffs = [
      {
        path: 'src/a.ts',
        diff: `diff --git a/src/a.ts b/src/a.ts
@@ -1,1 +1,2 @@
 const a = 1
+const b = 2`,
      },
      {
        path: 'src/b.ts',
        diff: `diff --git a/src/b.ts b/src/b.ts
@@ -5,1 +5,2 @@
 const c = 3
+const d = 4`,
      },
    ]

    const result = parseChangedLineNumbers(fileDiffs)

    expect(result.get('src/a.ts')).toContain(2)
    expect(result.get('src/b.ts')).toContain(6)
    expect(result.get('src/a.ts')).not.toContain(6)
  })

  it('should return an empty set for a file with no changed lines', () => {
    const fileDiffs = [
      {
        path: 'src/foo.ts',
        diff: `diff --git a/src/foo.ts b/src/foo.ts`,
      },
    ]

    const result = parseChangedLineNumbers(fileDiffs)

    expect(result.get('src/foo.ts')?.size).toBe(0)
  })
})

describe('isIgnoredFile', () => {
  it('should ignore lock files', () => {
    expect(isIgnoredFile('pnpm-lock.yaml')).toBe(true)
    expect(isIgnoredFile('package-lock.json')).toBe(true)
    expect(isIgnoredFile('yarn.lock')).toBe(true)
  })

  it('should ignore snapshot files', () => {
    expect(isIgnoredFile('src/__tests__/foo.test.ts.snap')).toBe(true)
  })

  it('should ignore dist and generated directories', () => {
    expect(isIgnoredFile('dist/index.js')).toBe(true)
    expect(isIgnoredFile('.github/actions/ai-reviewer/dist/index.js')).toBe(true)
  })

  it('should ignore generated payload types', () => {
    expect(isIgnoredFile('test/fields/payload-types.ts')).toBe(true)
  })

  it('should not ignore regular source files', () => {
    expect(isIgnoredFile('src/index.ts')).toBe(false)
    expect(isIgnoredFile('packages/payload/src/collections/config/types.ts')).toBe(false)
  })
})
