export const extractID = <IDType extends number | string>(
  objectOrID: IDType | { id: IDType },
): IDType => {
  if (typeof objectOrID === 'string' || typeof objectOrID === 'number') {
    return objectOrID
  }

  return objectOrID?.id
}
