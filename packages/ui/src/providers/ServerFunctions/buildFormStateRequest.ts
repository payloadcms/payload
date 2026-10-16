import type { FormField, FormState, Row } from 'payload'

import { setOwnProperty } from 'payload/shared'

type RowRequest = Pick<
  Row,
  'addedByServer' | 'blockType' | 'collapsed' | 'id' | 'isLoading' | 'lastRenderedPath'
>

/** Field values and metadata accepted by form-state and document requests. */
export type FormStateRequest = Record<
  string,
  { rows?: RowRequest[] } & Pick<
    FormField,
    | 'addedByServer'
    | 'blocksFilterOptions'
    | 'disableFormData'
    | 'errorMessage'
    | 'errorPaths'
    | 'initialValue'
    | 'isModified'
    | 'lastRenderedPath'
    | 'passesCondition'
    | 'valid'
    | 'value'
  >
>

export function buildFormStateRequest({
  formState,
}: {
  formState: FormState | undefined
}): FormStateRequest | undefined {
  if (!formState) {
    return formState
  }

  const request: FormStateRequest = {}

  for (const [path, field] of Object.entries(formState)) {
    setOwnProperty({
      key: path,
      target: request,
      value: {
        addedByServer: field.addedByServer,
        blocksFilterOptions: field.blocksFilterOptions,
        disableFormData: field.disableFormData,
        errorMessage: field.errorMessage,
        errorPaths: field.errorPaths,
        initialValue:
          path === 'file' ? getFileMetadata({ value: field.initialValue }) : field.initialValue,
        isModified: field.isModified,
        lastRenderedPath: field.lastRenderedPath,
        passesCondition: field.passesCondition,
        rows: field.rows?.map((row) => ({
          id: row.id,
          addedByServer: row.addedByServer,
          blockType: row.blockType,
          ...('collapsed' in row ? { collapsed: row.collapsed } : {}),
          isLoading: row.isLoading,
          lastRenderedPath: row.lastRenderedPath,
        })),
        valid: field.valid,
        value: path === 'file' ? getFileMetadata({ value: field.value }) : field.value,
      } satisfies FormStateRequest[string],
    })
  }

  return request
}

function getFileMetadata({ value }: { value: unknown }): unknown {
  // Validation needs the filename; the browser retains the bytes for submission and retries.
  return typeof File !== 'undefined' && value instanceof File ? { name: value.name } : value
}
