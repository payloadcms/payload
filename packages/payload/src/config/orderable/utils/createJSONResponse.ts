/**
 * Creates a JSON `Response` with consistent headers and status code.
 */
export function createJSONResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}
