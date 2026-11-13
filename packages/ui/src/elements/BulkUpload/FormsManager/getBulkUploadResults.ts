export type BulkUploadResultForm = {
  errorCount: number
}

export type BulkUploadResults<TForm extends BulkUploadResultForm> = {
  errorCount: number
  remainingForms: TForm[]
  successCount: number
}

/**
 * Marks a bulk-upload form as failed when its upload request is interrupted
 * (rejected `fetch`, aborted request, DNS blip, ...).
 *
 * Every other path in `saveAllDocs` assigns `errorCount` before moving on;
 * without this, an interrupted upload keeps the `errorCount: 0` it was
 * initialised with and is silently dropped from the retry queue and counted
 * as a success.
 */
export function markBulkUploadFormAsFailed<TForm extends BulkUploadResultForm>(form: TForm): TForm {
  return {
    ...form,
    errorCount: form.errorCount + 1,
  }
}

/**
 * Partitions the forms processed by `saveAllDocs` into the retry queue
 * (`remainingForms`) and derives the success / error counts shown to the user.
 */
export function getBulkUploadResults<TForm extends BulkUploadResultForm>(
  currentForms: TForm[],
): BulkUploadResults<TForm> {
  const remainingForms = currentForms.filter((form) => form.errorCount)

  const successCount = Math.max(0, currentForms.length - remainingForms.length)
  const errorCount = currentForms.length - successCount

  return { errorCount, remainingForms, successCount }
}
