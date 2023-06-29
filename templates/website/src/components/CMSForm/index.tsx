'use client'

import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

import { Form } from '../../payload-types'
import { Button } from '../Button'
import RichText from '../RichText'
import { buildInitialFormState } from './buildInitialFormState'
import { fields } from './fields'

import classes from './index.module.scss'

export type Value = unknown

export interface Property {
  [key: string]: Value
}

export interface Data {
  [key: string]: Value | Property | Property[]
}

export type FormBlockType = {
  enableIntro: Boolean
  formIntroContent?: {
    [k: string]: unknown
  }[]
  form: Form
}

export const CMSForm: React.FC<FormBlockType> = props => {
  const {
    enableIntro,
    formIntroContent,
    form: formFromProps,
    form: { id: formID, submitButtonLabel, confirmationType, redirect, confirmationMessage } = {},
  } = props

  const formMethods = useForm({
    defaultValues: buildInitialFormState(formFromProps.fields),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    getValues,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ status?: string; message: string } | undefined>()
  const router = useRouter()

  const onSubmit = useCallback(
    (data: Data) => {
      let loadingTimerID: NodeJS.Timer

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

        try {
          const req = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/form-submissions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)
            setError({
              status: res.status,
              message: res.errors?.[0]?.message || 'Internal Server Error',
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const { url } = redirect

            if (!url) return

            const redirectUrl = new URL(url, process.env.NEXT_PUBLIC_SERVER_URL)

            try {
              if (url.startsWith('/') || redirectUrl.origin === process.env.NEXT_PUBLIC_SERVER_URL) {
                router.push(redirectUrl.href)
              } else {
                window.location.assign(url)
              }
            } catch (err) {
              console.warn(err) // eslint-disable-line no-console
              setError({
                message: 'Something went wrong. Did not redirect.',
              })
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  return (
    <div className={[classes.form, hasSubmitted && classes.hasSubmitted].filter(Boolean).join(' ')}>
      {enableIntro && formIntroContent && !hasSubmitted && (
        <RichText className={classes.intro} content={formIntroContent} />
      )}
      {!isLoading && hasSubmitted && confirmationType === 'message' && (
        <RichText className={classes.confirmationMessage} content={confirmationMessage} />
      )}
      {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
      {error && <div>{`${error.status || '500'}: ${error.message || ''}`}</div>}
      {!hasSubmitted && (
        <form id={formID} onSubmit={handleSubmit(onSubmit)}>
          <div className={classes.fieldWrap}>
            {formFromProps &&
              formFromProps.fields &&
              formFromProps.fields.map((field, index) => {
                const Field: React.FC<any> = fields?.[field.blockType]
                if (Field) {
                  return (
                    <React.Fragment key={index}>
                      <Field
                        form={formFromProps}
                        {...field}
                        {...formMethods}
                        register={register}
                        errors={errors}
                        control={control}
                      />
                    </React.Fragment>
                  )
                }
                return null
              })}
          </div>
          <Button
            label={submitButtonLabel}
            appearance="primary"
            el="button"
            type="submit"
            form={formID}
          />
        </form>
      )}
    </div>
  )
}
