/**
 * Reads the reason a client upload request was refused from Payload's `{ errors: [{ message }] }`
 * response. Returns `fallback` when the response carries no message, such as an edge error page.
 */
export const getClientUploadErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const body = (await response.json()) as { errors?: { message?: unknown }[] }
    const messages = Array.isArray(body?.errors)
      ? body.errors
          .map((error) => error?.message)
          .filter(
            (message): message is string => typeof message === 'string' && message.trim() !== '',
          )
      : []

    if (messages.length > 0) {
      return messages.join(', ')
    }
  } catch {
    // Not JSON, so there is no reason to read.
  }

  return fallback
}
