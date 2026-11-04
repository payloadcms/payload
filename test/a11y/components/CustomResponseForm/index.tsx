'use client'

import { Form, FormSubmit } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { useRef, useState } from 'react'

const initialState = {}

export function CustomResponseForm() {
  const finishHandler = useRef<() => void>(undefined)
  const [isHandlingResponse, setIsHandlingResponse] = useState(false)

  return (
    <>
      <h1>Custom response form</h1>
      <Form
        action={formatAdminURL({ apiRoute: '/api', path: '/a11y-custom-response' })}
        className="custom-response-form"
        disableSuccessStatus
        handleResponse={async () => {
          await new Promise<void>((resolve) => {
            finishHandler.current = resolve
            setIsHandlingResponse(true)
          })
          setIsHandlingResponse(false)
        }}
        initialState={initialState}
        method="POST"
      >
        <FormSubmit>Submit custom response</FormSubmit>
      </Form>
      <button
        disabled={!isHandlingResponse}
        onClick={() => finishHandler.current?.()}
        type="button"
      >
        Finish response handler
      </button>
    </>
  )
}
