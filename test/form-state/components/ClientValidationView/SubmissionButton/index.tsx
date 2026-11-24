'use client'

import { useForm, useFormBackgroundProcessing, useFormProcessing } from '@payloadcms/ui'

export const SubmissionButton = ({
  disableSuccessStatus = true,
  submissionType,
}: {
  disableSuccessStatus?: boolean
  submissionType: 'autosave' | 'submit'
}) => {
  const { dispatchFields, submit } = useForm()
  const isProcessing = useFormProcessing()
  const isBackgroundProcessing = useFormBackgroundProcessing()

  return (
    <>
      <button
        disabled={isProcessing || isBackgroundProcessing}
        onClick={() =>
          void submit({
            disableFormWhileProcessing: submissionType === 'submit',
            disableSuccessStatus,
            submissionType,
          })
        }
        type="button"
      >
        Submit
      </button>
      <button
        onClick={() =>
          dispatchFields({
            type: 'UPDATE',
            path: 'clientValidatedValue',
            value: 'Changed during submission',
          })
        }
        type="button"
      >
        Update value
      </button>
    </>
  )
}
