export type BulkActionError = {
  isPublic?: boolean
  message?: null | string
}

export type BulkErrorToastContent = {
  description?: string
  message: string
}

/**
 * Unique per-document messages for one bulk-action toast.
 *
 * Update and delete responses already replace a non-public error's message
 * before it reaches the client. This only reads that `message`, including the
 * sanitized fallback left on `isPublic: false`, and nothing else on the error.
 */
export function getBulkErrorMessages({
  errors,
}: {
  errors?: null | readonly (BulkActionError | null)[]
}): string[] {
  if (!Array.isArray(errors)) {
    return []
  }

  const seen = new Set<string>()
  const messages: string[] = []

  for (const error of errors) {
    if (!error || typeof error.message !== 'string') {
      continue
    }

    const message = error.message.trim()

    if (!message || seen.has(message)) {
      continue
    }

    seen.add(message)
    messages.push(message)
  }

  return messages
}

export function formatBulkErrorDescription({
  errors,
}: {
  errors?: null | readonly (BulkActionError | null)[]
}): string | undefined {
  const messages = getBulkErrorMessages({ errors })

  if (messages.length === 0) {
    return undefined
  }

  return messages.join('\n')
}

/**
 * A headline plus optional reasons, as passed into the form's error toast.
 * React elements are objects too, so those stay on the normal toast path.
 */
export function readBulkErrorToast(data: unknown): BulkErrorToastContent | null {
  if (!data || typeof data !== 'object' || Array.isArray(data) || '$$typeof' in data) {
    return null
  }

  if (!('message' in data) || typeof data.message !== 'string' || data.message.length === 0) {
    return null
  }

  const description =
    'description' in data && typeof data.description === 'string' && data.description.length > 0
      ? data.description
      : undefined

  return {
    description,
    message: data.message,
  }
}
