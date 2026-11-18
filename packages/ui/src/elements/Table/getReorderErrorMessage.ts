const defaultReorderErrorMessage =
  'Failed to reorder. This can happen if you reorder several rows too quickly. Please try again.'

/**
 * Returns the message to show when a reorder request fails.
 *
 * Errors thrown while reordering, for example an `APIError` from a collection hook, are returned in
 * the `errors` array of the response, and their message is shown. Internal server errors (status 500)
 * are masked by the server, so the generic retry message is shown for them and for responses without
 * an error message.
 */
export const getReorderErrorMessage = async ({
  response,
}: {
  response: Response
}): Promise<string> => {
  if (response.status === 500) {
    return defaultReorderErrorMessage
  }

  try {
    const body = (await response.json()) as { errors?: { message?: unknown }[] } | null
    const message = body?.errors?.[0]?.message

    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  } catch {
    // The response body is not JSON, fall back to the generic message
  }

  return defaultReorderErrorMessage
}
