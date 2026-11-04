import type { Request } from '@playwright/test'

export function isFormStateRequest({ pageURL, request }: { pageURL: string; request: Request }) {
  if (request.method() !== 'POST') {
    return false
  }

  return (
    request.url() === pageURL ||
    (request.url().includes('/_serverFn/') && (request.postData() ?? '').includes('form-state'))
  )
}
