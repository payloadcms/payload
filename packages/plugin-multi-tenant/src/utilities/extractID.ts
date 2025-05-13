import type { Tenant } from '../types.js'

export const extractID = <IDType extends number | string>(
  objectOrID: IDType | Tenant<IDType>,
): IDType => {
  if (typeof objectOrID === 'string' || typeof objectOrID === 'number') {
    return objectOrID
  }

  return objectOrID.id
}
