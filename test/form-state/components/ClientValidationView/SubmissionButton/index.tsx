'use client'

import { useForm, useFormBackgroundProcessing, useFormProcessing } from '@payloadcms/ui'

export const SubmissionButton = ({ submissionType }: { submissionType: 'autosave' | 'submit' }) => {
  const { submit } = useForm()
  const isProcessing = useFormProcessing()
  const isBackgroundProcessing = useFormBackgroundProcessing()

  return (
    <button
      disabled={isProcessing || isBackgroundProcessing}
      onClick={() =>
        void submit({
          disableFormWhileProcessing: submissionType === 'submit',
          disableSuccessStatus: true,
          submissionType,
        })
      }
      type="button"
    >
      Submit
    </button>
  )
}
