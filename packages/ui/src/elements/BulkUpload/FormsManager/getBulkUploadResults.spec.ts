import { describe, expect, it } from 'vitest'

import { getBulkUploadResults, markBulkUploadFormAsFailed } from './getBulkUploadResults.js'

describe('markBulkUploadFormAsFailed', () => {
  it('should bump errorCount so an interrupted upload is not treated as a success', () => {
    const form = { errorCount: 0, formID: 'interrupted', formState: {} }

    const result = markBulkUploadFormAsFailed(form)

    expect(result.errorCount).toBe(1)
    // the rest of the form is preserved for the retry
    expect(result.formID).toBe('interrupted')
    expect(result.formState).toBe(form.formState)
  })

  it('should accumulate on top of errors from a previous round', () => {
    const result = markBulkUploadFormAsFailed({ errorCount: 2, formID: 'retry' })

    expect(result.errorCount).toBe(3)
  })
})

describe('getBulkUploadResults', () => {
  it('should keep an interrupted upload in the retry queue instead of counting it as a success', () => {
    // saveAllDocs marks forms whose upload request was interrupted via
    // markBulkUploadFormAsFailed in its catch block
    const interrupted = markBulkUploadFormAsFailed({ errorCount: 0, formID: 'interrupted' })
    const currentForms = [{ errorCount: 0, formID: 'saved' }, interrupted]

    const { errorCount, remainingForms, successCount } = getBulkUploadResults(currentForms)

    expect(remainingForms.map((form) => form.formID)).toEqual(['interrupted'])
    expect(successCount).toBe(1)
    expect(errorCount).toBe(1)
  })

  it('should count every form as a success when none failed', () => {
    const currentForms = [
      { errorCount: 0, formID: 'a' },
      { errorCount: 0, formID: 'b' },
    ]

    const { errorCount, remainingForms, successCount } = getBulkUploadResults(currentForms)

    expect(remainingForms).toEqual([])
    expect(successCount).toBe(2)
    expect(errorCount).toBe(0)
  })

  it('should retry every form when all of them failed', () => {
    const currentForms = [
      { errorCount: 1, formID: 'a' },
      { errorCount: 3, formID: 'b' },
    ]

    const { errorCount, remainingForms, successCount } = getBulkUploadResults(currentForms)

    expect(remainingForms.map((form) => form.formID)).toEqual(['a', 'b'])
    expect(successCount).toBe(0)
    expect(errorCount).toBe(2)
  })
})
