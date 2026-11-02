'use client'

import { toast } from '@payloadcms/ui'
import { useRef } from 'react'

export function StatusMessages() {
  const resolvePromise = useRef<() => void>(undefined)

  return (
    <>
      <button
        onClick={() =>
          toast('Action notification', {
            action: { label: 'Undo change', onClick: () => {} },
            description: 'Action description',
          })
        }
        type="button"
      >
        Show action toast
      </button>
      <button
        onClick={() =>
          toast.custom(() => (
            <div>
              Custom notification{' '}
              <img
                alt="Upload complete"
                src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
              />
              <button aria-label="Retry upload" type="button">
                Retry
              </button>
              <a href="#details">View details</a>
              <span hidden id="toast-download-label">
                Download file
              </span>
              <button aria-labelledby="toast-download-label" type="button">
                Download
              </button>
            </div>
          ))
        }
        type="button"
      >
        Show custom toast
      </button>
      <button
        onClick={() => {
          toast('First rapid notification')
          window.setTimeout(() => toast('Second rapid notification'), 50)
        }}
        type="button"
      >
        Show rapid toasts
      </button>
      <button
        onClick={() => {
          toast.promise(
            new Promise<void>((resolve) => {
              resolvePromise.current = resolve
            }),
            {
              loading: 'Uploading file',
              success: 'File uploaded',
            },
          )
        }}
        type="button"
      >
        Start upload
      </button>
      <button onClick={() => resolvePromise.current?.()} type="button">
        Finish upload
      </button>
    </>
  )
}
