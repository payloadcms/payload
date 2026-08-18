import assert from 'node:assert/strict'

const reactSelectPath = import.meta.resolve('@payloadcms/ui/elements/ReactSelect')

assert.match(reactSelectPath, /elements\/ReactSelect\/index\.tsx$/)
