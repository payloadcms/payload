'use client'

import { useCallback, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useRouter } from 'next/navigation'

import type { FormFieldBlock, Form as FormType } from '@payloadcms/plugin-form-builder/types'
// avoid importing payload lexical types in client component
// they pull in payload logger modules which use worker_threads

import { fields } from './fields'
import { Button } from '@/components/ui/button'
import { RichText } from '@/components/RichText'
import { getClientSideURL } from '@/utils/getURL'

export type FormBlockType = {
  blockName?: string
  blockType?: 'formBlock'
  enableIntro: boolean
  form: FormType
  // use a loose type here to keep client code free of richtext dependency
  introContent?: any
}

export const FormBlock: React.FC<
  {
    id?: string
  } & FormBlockType
> = (props) => {
  const {
    enableIntro,
    form: formFromProps,
    form: { id: formID, confirmationMessage, confirmationType, redirect, submitButtonLabel } = {},
    introContent,
  } = props

  const formMethods = useForm({
    defaultValues: formFromProps.fields,
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  function computeErrorMessage(res: any): string {
    if (
      res &&
      typeof res === 'object' &&
      Array.isArray(res.errors) &&
      res.errors.length > 0 &&
      res.errors[0] &&
      typeof res.errors[0].message === 'string'
    ) {
      return res.errors[0].message
    }
    return 'Internal Server Error'
  }

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        // precompute redirect URL so no logical expression appears in the try block
        let redirectUrl = ''
        if (confirmationType === 'redirect' && redirect && typeof redirect.url === 'string') {
          redirectUrl = redirect.url
        }

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            const errorMessage = computeErrorMessage(res)

            setError({
              message: errorMessage,
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (redirectUrl) {
            router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  return (
    <div className="container lg:max-w-3xl">
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}
      <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === 'message' && (
            <RichText data={confirmationMessage} />
          )}
          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
          {error && <div>{`${error.status || '500'}: ${error.message || ''}`}</div>}
          {!hasSubmitted && (
            <form id={formID} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {formFromProps?.fields?.map((field, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
                  if (Field) {
                    return (
                      <div className="mb-6 last:mb-0" key={index}>
                        <Field
                          form={formFromProps}
                          {...field}
                          {...formMethods}
                          control={control}
                          errors={errors}
                          register={register}
                          type={
                            field.blockType === 'country' || field.blockType === 'state'
                              ? field.blockType
                              : undefined
                          }
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              <Button form={formID} type="submit" variant="default">
                {submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}
