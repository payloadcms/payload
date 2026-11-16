/**
 * Private, single-use handoff between the job runner and the bulk update operation.
 * Keying by the update data object isolates nested operations using the same request,
 * without changing the database adapter or exposing an option in the Local/REST API.
 */
const jobClaims = new WeakMap<object, Set<number | string>>()

export function registerJobClaim(data: object, ids: (number | string)[]): void {
  jobClaims.set(data, new Set(ids))
}

export function clearJobClaim(data: object): void {
  jobClaims.delete(data)
}

export function takeJobClaim(data: object): Set<number | string> | undefined {
  const ids = jobClaims.get(data)
  jobClaims.delete(data)
  return ids
}
