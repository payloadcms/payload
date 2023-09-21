'use client'
import React, { FC, Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Data } from 'payload/dist/admin/components/forms/Form/types'

import { Form as FormTypes } from '../../../payload/payload-types'
import { Block } from '../ui/block'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { RichText } from './richText'

type ErrorType = {
  status: string
  message: string
}

export type FormBlockProps = {
  form: FormTypes
  intro?: unknown
}

export interface FormField {
  name: string
  label?: string
  width?: number
  defaultValue?: string
  required?: boolean
  id?: string
  blockName?: string
  blockType: 'text' | 'textarea' | 'email' | 'message'
  message?: {
    [k: string]: unknown
  }[]
}

function groupFieldsByRow(form: FormTypes): FormTypes['fields'][] {
  const rows: FormTypes['fields'][] = []
  let currentRow: FormTypes['fields'] = []
  let currentRowWidth = 0

  for (const field of form.fields || []) {
    const fieldWidth = field.blockType !== 'message' ? field.width || 100 : 100 // Assuming a default width of 100% if not specified

    // Check if adding this field to the current row would exceed 100%
    if (currentRowWidth + fieldWidth > 100) {
      // End the current row and start a new one
      rows.push(currentRow)
      currentRow = []
      currentRowWidth = 0
    }

    // Add the field to the current row and update the width
    currentRow.push(field)
    currentRowWidth += fieldWidth
  }

  // If there are any remaining fields in the current row, add them to the rows
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  return rows
}

export const FormBlock: FC<FormBlockProps> = props => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {
    form: formFromProps,
    form: { id: formID, submitButtonLabel },
    intro,
  } = props

  const formMethods = useForm()
  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = formMethods

  const [error, setError] = useState<ErrorType | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data: Data) => {
    setIsLoading(true) // Set loading state when submitting

    const dataToSend = Object.entries(data).map(([name, value]) => ({
      field: name,
      value,
    }))

    try {
      const req = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/form-submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Correct typo: "Content-Types" to "Content-Type"
        },
        body: JSON.stringify({
          form: formID,
          submissionData: dataToSend,
        }),
      })

      const res = await req.json()

      if (req.status >= 400) {
        setError({
          status: res.status,
          message: res.errors?.[0] || 'Internal Server Error', // Use optional chaining
        })
      }

      setIsLoading(false) // Clear loading state
      if (props.form.confirmationType === 'message') {
        setDialogOpen(true)
      } else if (props.form.redirect) {
        window.location.href = props.form.redirect.url
      } else {
        // eslint-disable-next-line no-console
        console.error('No post-submit action defined for form')
      }
    } catch (error) {
      setError({
        status: 'Error',
        message: 'An error occurred while submitting the form.',
      })
      setIsLoading(false) // Clear loading state
    }
  }

  return (
    <Block className="w-full flex flex-col m-auto" key={formID}>
      {intro && <RichText content={intro} className="w-full" />}
      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
        {groupFieldsByRow(formFromProps).map((row, index) => (
          <div key={index}>
            {row.map((field, index) => {
              if (field.blockType === 'message') {
                return <RichText content={field.message} className="-mb-4" key={index} />
              }

              let pattern
              if (field.blockType === 'email') {
                pattern = {
                  value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
                  message: 'Please enter a valid email address.',
                }
              }

              const props = {
                id: `${formID}-${field.name}`,
                ...register(field.name, { required: field.required, pattern }),
              }

              let content

              switch (field.blockType) {
                case 'text':
                case 'email':
                  content = <Input type="text" {...props} />
                  break
                case 'textarea':
                  content = <Textarea {...props} />
                  break
                default:
                  content = null
                  break
              }

              return (
                <Fragment key={`row-${index}`}>
                  <style
                    key={`style-${index}`}
                    dangerouslySetInnerHTML={{
                      __html: `
                    #formField__${props.id} {
                      width: 100%;
                    }

                    @media (min-width: 1024px) {
                      #formField__${props.id} {
                        width: ${field.width}%;
                      }
                    }
                  `,
                    }}
                  />
                  <div
                    id={`formField__${props.id}`}
                    key={`${formID}-${field.name}-${index}`}
                    className="inline-flex flex-col gap-2 mt-4 first:mt-0 content-box pb-4 last:pb-0 lg:pb-0 pr-0 lg:pr-5 last:pr-0 "
                  >
                    <label htmlFor={props.id} className="text-sm text-primary">
                      {field.label}
                    </label>
                    {content}
                    {formMethods.formState.errors[field.name]?.message && (
                      <div className="text-sm text-red-500 mt-2">
                        {formMethods.formState.errors[field.name].message as string}
                      </div>
                    )}
                  </div>
                </Fragment>
              )
            })}
          </div>
        ))}
        <Button type="submit" disabled={isLoading || !isDirty} className="max-w-[80px] mt-8">
          {submitButtonLabel}
        </Button>
        {error && <div className="mt-4">{error.message}</div>}
      </form>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[80vw] max-w-lg">
          <div className="flex flex-col gap-4 items-center">
            <RichText content={props.form.confirmationMessage} />
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Block>
  )
}
