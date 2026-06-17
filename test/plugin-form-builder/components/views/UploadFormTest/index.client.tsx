'use client'

import { Button, TextInput } from '@payloadcms/ui'
import React, { useRef, useState } from 'react'

import type { Form } from '../../../payload-types.js'

import './index.css'

type UploadFieldBlock = Extract<NonNullable<Form['fields']>[number], { blockType: 'upload' }>
type NonUploadFieldBlock = Exclude<NonNullable<Form['fields']>[number], { blockType: 'upload' }>
type NamedNonUploadField = {
  label?: null | string
  name: string
  required?: boolean | null
} & NonUploadFieldBlock

type UploadResult = { collection: string; fieldName: string; id: string }

type SubmitResult = {
  submissionId: string
  uploads: UploadResult[]
}

function SingleFormSection({ form, serverURL }: { form: Form; serverURL: string }) {
  const [result, setResult] = useState<null | SubmitResult>(null)
  const [error, setError] = useState<null | string>(null)
  const [loading, setLoading] = useState(false)
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)

  const fields = form.fields ?? []
  const textFields = fields.filter((f): f is NonUploadFieldBlock => f.blockType !== 'upload')
  const uploadFields = fields.filter((f): f is UploadFieldBlock => f.blockType === 'upload')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResult(null)
    setError(null)
    setLoading(true)

    try {
      const htmlForm = e.currentTarget
      const formData = new FormData()

      const submissionData = textFields
        .filter((f): f is NamedNonUploadField => 'name' in f)
        .map((f) => ({
          field: f.name,
          value: textValues[f.name] ?? '',
        }))

      formData.append(
        '_payload',
        JSON.stringify({
          form: form.id,
          submissionData,
        }),
      )

      // Append all selected files (multiple files per field supported)
      for (const uploadField of uploadFields) {
        const fileInput = htmlForm.elements.namedItem(uploadField.name) as HTMLInputElement
        if (fileInput?.files?.length) {
          for (let i = 0; i < fileInput.files.length; i++) {
            formData.append(uploadField.name, fileInput.files[i]!)
          }
        }
      }

      const response = await fetch(`${serverURL}/api/form-submissions`, {
        body: formData,
        method: 'POST',
      })

      const json = await response.json()

      if (!response.ok) {
        const apiErrors = json?.errors?.[0]?.data?.errors
        if (Array.isArray(apiErrors) && apiErrors.length > 0) {
          setError(apiErrors.map((e: { message: string }) => e.message).join('; '))
        } else {
          setError(json?.errors?.[0]?.message ?? `Request failed: ${response.status}`)
        }
        return
      }

      // Read upload results from submissionUploads (the structured upload field)
      // Each entry has value: Array<{ relationTo, value: rawId | populatedDoc }>
      const uploadResults: UploadResult[] = []
      for (const uploadEntry of json.doc?.submissionUploads ?? []) {
        const uploadField = uploadFields.find((f) => f.name === uploadEntry.field)
        if (!uploadField) {
          continue
        }
        const items: unknown[] = Array.isArray(uploadEntry.value) ? uploadEntry.value : []
        for (const item of items) {
          // Each item is polymorphic: { relationTo, value: rawId | populatedDoc }
          const unwrapped =
            typeof item === 'object' && item !== null && 'value' in item
              ? (item as { value: unknown }).value
              : item
          // Unwrapped may be a populated Payload document — extract its id
          const id =
            typeof unwrapped === 'object' && unwrapped !== null && 'id' in unwrapped
              ? String((unwrapped as { id: unknown }).id)
              : String(unwrapped)
          const collection =
            typeof item === 'object' && item !== null && 'relationTo' in item
              ? (item as { relationTo: string }).relationTo
              : uploadField.uploadCollection
          uploadResults.push({ id, collection, fieldName: uploadEntry.field })
        }
      }

      setResult({ submissionId: json.doc.id, uploads: uploadResults })
      formRef.current?.reset()
      setTextValues({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="upload-form-test__section" data-testid={`form-section-${form.id}`}>
      <h2 className="upload-form-test__section-title">{form.title}</h2>

      <form className="upload-form-test__form" onSubmit={handleSubmit} ref={formRef}>
        {textFields
          .filter((f): f is NamedNonUploadField => 'name' in f)
          .map((field) => (
            <TextInput
              key={field.name}
              label={field.label ?? field.name}
              onChange={(e) => {
                setTextValues((previousValues) => ({
                  ...previousValues,
                  [field.name]: e.target.value,
                }))
              }}
              path={`${String(form.id)}.${field.name}`}
              required={Boolean(field.required)}
              value={textValues[field.name] ?? ''}
            />
          ))}

        {uploadFields.map((field) => {
          const allowedTypes = field.mimeTypes?.map((m) => m.mimeType).join(', ')
          return (
            <div className="upload-form-test__field" key={field.name}>
              <label className="upload-form-test__label" htmlFor={`${form.id}-${field.name}`}>
                {field.label ?? field.name}
                {field.required ? ' *' : ''}
              </label>
              {allowedTypes && (
                <p className="upload-form-test__help" data-testid={`allowed-types-${field.name}`}>
                  Allowed: {allowedTypes}
                </p>
              )}
              <input
                accept={allowedTypes}
                className="upload-form-test__file-input"
                id={`${form.id}-${field.name}`}
                multiple={field.multiple ?? false}
                name={field.name}
                required={field.required ?? false}
                type="file"
              />
            </div>
          )
        })}

        <Button buttonStyle="primary" loading={loading} margin={false} type="submit">
          Submit
        </Button>
      </form>

      {error && (
        <p className="upload-form-test__error" data-testid="upload-error">
          {error}
        </p>
      )}

      {result && (
        <div className="upload-form-test__success" data-testid="upload-success">
          <p className="upload-form-test__success-title">
            Submission created (id: {result.submissionId})
          </p>
          {result.uploads.map((u, i) => (
            <p data-testid={`upload-result-${u.fieldName}`} key={`${u.fieldName}-${i}`}>
              {u.fieldName}: uploaded to <strong>{u.collection}</strong> (id: {u.id})
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

export function UploadFormTestClient({ forms, serverURL }: { forms: Form[]; serverURL: string }) {
  if (forms.length === 0) {
    return <p>No forms with upload fields found.</p>
  }

  return (
    <div>
      {forms.map((form) => (
        <SingleFormSection form={form} key={form.id} serverURL={serverURL} />
      ))}
    </div>
  )
}
